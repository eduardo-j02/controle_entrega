# Arquitetura do Roteirizador Inteligente (Open Source)

## 1. Visão Geral

Este documento detalha a arquitetura proposta para a implementação de um roteirizador de entregas inteligente no projeto `controle_entrega`, com foco exclusivo em **ferramentas gratuitas e de código aberto**. O objetivo é permitir que o sistema receba uma lista de endereços de entrega e retorne a rota mais eficiente, considerando a otimização da sequência de paradas e o cálculo de pedágios, sem depender de APIs pagas.

## 2. Análise das Ferramentas de Roteirização e Pedágios (Open Source)

Após pesquisa, as seguintes ferramentas e abordagens foram consideradas:

*   **OpenStreetMap (OSM)**: Base de dados geográfica colaborativa e gratuita, fundamental para o roteamento open-source.
*   **OSRM (Open Source Routing Machine)**: Motor de roteamento de alta performance que utiliza dados do OSM. Oferece APIs HTTP para cálculo de rotas otimizadas (menor tempo, menor distância). Existem instâncias públicas disponíveis, ou pode ser auto-hospedado para maior controle e performance.
*   **Leaflet**: Biblioteca JavaScript leve e de código aberto para mapas interativos, ideal para visualização no frontend.
*   **Dados Abertos de Pedágios**: Para o cálculo de pedágios, será utilizada uma abordagem baseada em dados abertos da **ANTT (Agência Nacional de Transportes Terrestres)** e de órgãos estaduais (como o governo de São Paulo), que disponibilizam informações sobre praças de pedágio e suas tarifas. Será necessário coletar e estruturar esses dados em uma base local.

**Decisão**: A combinação de **OSRM** para roteirização e **Leaflet** para visualização de mapas, alimentados por dados do **OpenStreetMap**, oferece uma solução robusta e totalmente gratuita. O cálculo de pedágios será feito com base em dados abertos, exigindo um processamento adicional no backend para identificar praças de pedágio na rota e aplicar as tarifas correspondentes.

## 3. Modificações no Backend (Node.js com Prisma)

### 3.1. Modelos Prisma

Os modelos `Rota` e `PontoParada` serão mantidos, pois sua estrutura é genérica o suficiente para armazenar dados de roteamento de qualquer fonte. No entanto, o campo `custoPedagio` será preenchido com base na lógica de dados abertos.

#### Modelo `Rota` (Atualização)

```prisma
model Rota {
  id                   Int           @id @default(autoincrement())
  numero               String        @unique
  notas                Nota[]
  createdAt            DateTime      @default(now())
  redespacho           Boolean       @default(false)
  origem               String?       // Endereço de partida da rota
  destino              String?       // Endereço final da rota (opcional)
  distanciaKm          Float?        // Distância total da rota em KM
  tempoEstimadoMinutos Int?          // Tempo estimado total da rota em minutos
  custoPedagio         Float?        // Custo total de pedágio da rota (calculado via dados abertos)
  pontosParada         PontoParada[]
  dataOtimizacao       DateTime?     // Data da última otimização
}
```

#### Novo Modelo `PontoParada`

```prisma
model PontoParada {
  id        Int      @id @default(autoincrement())
  rotaId    Int
  rota      Rota     @relation(fields: [rotaId], references: [id], onDelete: Cascade)
  endereco  String   // Endereço completo do ponto de parada
  latitude  Float?
  longitude Float?
  ordem     Int      // Ordem da parada na rota otimizada
  tipo      String   // Ex: "ORIGEM", "ENTREGA", "DESTINO"
  notaId    Int?     // Opcional: linka a uma Nota específica se for um ponto de entrega
  nota      Nota?    @relation(fields: [notaId], references: [id], onDelete: SetNull)
  createdAt DateTime @default(now())
}
```

#### Novo Modelo `PracaPedagio` (para dados abertos)

```prisma
model PracaPedagio {
  id        Int      @id @default(autoincrement())
  nome      String
  rodovia   String
  km        Float?
  latitude  Float
  longitude Float
  valorCarro Float? // Exemplo: valor para carro de passeio
  // Outros campos para diferentes categorias de veículos e datas
  createdAt DateTime @default(now())
}
```

### 3.2. Endpoints da API

Os endpoints serão mantidos, mas a lógica interna será alterada para usar OSRM e a base de dados de pedágios:

*   `POST /rotas/otimizar`: Recebe uma lista de endereços (ou IDs de `Nota`) e retorna uma rota otimizada com detalhes de distância, tempo e pedágios. Cria ou atualiza uma `Rota` e seus `PontoParada`.
*   `GET /rotas/:id/detalhes`: Retorna os detalhes de uma rota específica, incluindo seus pontos de parada ordenados.

### 3.3. Lógica de Negócio e Integração com Ferramentas Open Source

1.  **Coleta e Estruturação de Dados de Pedágios**: Será necessário um script ou processo manual inicial para coletar dados de praças de pedágio da ANTT e outras fontes abertas, e importá-los para a tabela `PracaPedagio`.
2.  **Geocodificação**: Antes de usar o OSRM, os endereços textuais precisarão ser convertidos em coordenadas geográficas (latitude e longitude). Isso pode ser feito usando uma API de geocodificação gratuita, como a do OpenStreetMap (Nominatim) ou Photon.
3.  **Chamada ao OSRM**: Utilizar a API HTTP do OSRM (instância pública ou auto-hospedada) para calcular a rota otimizada entre os pontos. O endpoint `route` ou `trip` do OSRM será usado para obter a sequência otimizada de waypoints, distância e tempo.
4.  **Cálculo de Pedágios**: Após obter a rota do OSRM (que não inclui informações de pedágio), o backend irá:
    *   Identificar os segmentos da rota.
    *   Consultar a base de dados `PracaPedagio` para verificar se alguma praça de pedágio está localizada ao longo desses segmentos ou em pontos próximos.
    *   Somar os valores dos pedágios encontrados, considerando o tipo de veículo (se aplicável).
5.  **Processamento da Resposta**: Extrair do OSRM a distância total, tempo estimado e a sequência otimizada dos waypoints. Combinar com o custo de pedágio calculado.
6.  **Persistência**: Salvar ou atualizar a `Rota` e os `PontoParada` no banco de dados com as informações otimizadas.

## 4. Modificações no Frontend (React com Vite)

### 4.1. Nova Tela/Componente de Roteirização

A tela `Roteirizador.tsx` será adaptada para usar a biblioteca Leaflet.

### 4.2. Componentes da Interface do Usuário

*   **Entrada de Endereços**: Mantido.
*   **Botão de Otimização**: Mantido.
*   **Exibição de Detalhes da Rota**: Mantido.
*   **Mapa Interativo (Leaflet)**: Utilizar a biblioteca Leaflet para exibir o mapa. O mapa será renderizado com tiles do OpenStreetMap. Para desenhar a rota, será usado um plugin como `Leaflet Routing Machine` que pode se integrar ao OSRM.
    *   Marcadores personalizados para origem, destino e pontos de entrega.
*   **Lista de Paradas**: Mantido.

### 4.3. Integração com Backend

*   Utilizar a instância `api` existente (`src/services/api.ts`) para fazer requisições aos novos endpoints do backend.
*   Gerenciar o estado da tela (endereços, rota otimizada, carregamento, erros) usando React hooks (e.g., `useState`, `useEffect`).

## 5. Próximos Passos

1.  **Backend**: Implementar o modelo `PracaPedagio`, o serviço de geocodificação, a integração com OSRM e a lógica de cálculo de pedágios baseada em dados abertos.
2.  **Frontend**: Adaptar a nova tela de roteirização para usar Leaflet e `Leaflet Routing Machine`.
3.  **Testes**: Realizar testes unitários e de integração para garantir a funcionalidade completa.

## Referências

*   [1] OpenStreetMap. *Main Page*. Disponível em: [https://www.openstreetmap.org](https://www.openstreetmap.org)
*   [2] Project OSRM. *Open Source Routing Machine*. Disponível em: [https://project-osrm.org](https://project-osrm.org)
*   [3] Leaflet. *An Open-Source JavaScript Library for Mobile-Friendly Interactive Maps*. Disponível em: [https://leafletjs.com](https://leafletjs.com)
*   [4] ANTT. *Dados Abertos*. Disponível em: [https://dados.antt.gov.br](https://dados.antt.gov.br)
*   [5] OpenStreetMap Wiki. *Key:toll*. Disponível em: [https://wiki.openstreetmap.org/wiki/Key:toll](https://wiki.openstreetmap.org/wiki/Key:toll)
