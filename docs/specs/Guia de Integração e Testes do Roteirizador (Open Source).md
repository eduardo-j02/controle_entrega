# Guia de Integração e Testes do Roteirizador (Open Source)

## 1. Configuração Inicial

Este projeto utiliza ferramentas **gratuitas e de código aberto** para roteirização e mapas:
- **Roteirização**: OSRM (Open Source Routing Machine) com dados do OpenStreetMap.
- **Mapas**: Leaflet com tiles do OpenStreetMap.
- **Pedágios**: Base de dados local alimentada por dados abertos (ANTT/Governo).

### 1.1 Backend

#### Instalação de Dependências
```bash
cd backend
npm install
```

#### Banco de Dados
Como o schema foi alterado, você precisa rodar as migrations do Prisma:

```bash
npx prisma migrate dev --name add_roteirizador_open_source
```

#### Variáveis de Ambiente (.env)
```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/controle_entrega"
JWT_SECRET=seu_segredo_jwt_aqui
REFRESH_SECRET=seu_segredo_refresh_aqui
CORS_ORIGINS=http://localhost:5173

# OSRM e Nominatim (Públicos para teste, considere auto-hospedar para produção)
OSRM_BASE_URL=http://router.project-osrm.org/route/v1/driving
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org/search
```

#### Importar Dados de Pedágios
Você pode usar o endpoint `POST /pedagios/importar` para carregar a base de dados de pedágios. Um exemplo de script de importação pode ser criado para ler os dados da ANTT.

### 1.2 Frontend

#### Instalação de Dependências
```bash
cd frontend
npm install
```

#### Variáveis de Ambiente (.env)
```env
VITE_API_URL=http://localhost:3333
```

## 2. Fluxo de Uso

### 2.1 Acessar o Roteirizador
1. Faça login na aplicação.
2. Clique em **Roteirizador** (🗺️) no menu lateral.

### 2.2 Criar Rota
1. Informe o número da rota e o endereço de origem.
2. Adicione endereços de entrega (manualmente ou selecionando Notas Fiscais).
3. Clique em **Otimizar Rota**.
4. O sistema irá:
   - Converter endereços em coordenadas (Geocodificação via Nominatim).
   - Calcular a melhor rota (via OSRM).
   - Identificar pedágios no trajeto (via base local).
   - Exibir o resultado no mapa interativo (Leaflet).

## 3. Endpoints Principais

- `POST /rotas/otimizar`: Calcula e salva a rota.
- `GET /rotas/otimizadas`: Lista as rotas salvas.
- `POST /pedagios/importar`: Alimenta a base de pedágios.
- `GET /pedagios/proximas`: Consulta pedágios em um raio geográfico.

## 4. Vantagens desta Abordagem
- **Custo Zero**: Não depende de chaves de API pagas do Google Maps.
- **Privacidade**: Maior controle sobre os dados geográficos.
- **Customização**: Possibilidade de auto-hospedar os motores de busca e rota.

## 5. Referências
- [OpenStreetMap](https://www.openstreetmap.org)
- [Project OSRM](https://project-osrm.org)
- [Leaflet JS](https://leafletjs.com)
- [Dados Abertos ANTT](https://dados.antt.gov.br)
