# Serviços Externos - Guia de Manutenção

Este documento explica como trocar os serviços externos de geocodificação reversa e mapa estático no sistema.

## Serviços Atuais (Gratuitos)

### Geocodificação Reversa

- **Provedor**: Nominatim (OpenStreetMap)
- **Arquivo**: `src/services/geocodingService.ts`
- **Implementação**: `NominatimGeocodingService`

### Mapa Estático

- **Provedor**: OpenStreetMap Static Maps
- **Arquivo**: `src/services/staticMapService.ts`
- **Implementação**: `OSMStaticMapService`

## Como Trocar os Serviços

### 1. Geocodificação Reversa

Para trocar o serviço de geocodificação, edite o arquivo `src/services/geocodingService.ts`:

```typescript
// Na classe GeocodingServiceFactory, altere a linha:
export class GeocodingServiceFactory {
  static create(): GeocodingService {
    // DESCOMENTE uma das linhas abaixo e COMENTE a atual:

    // Google Geocoding API (requer API Key)
    // return new GoogleGeocodingService(process.env.GOOGLE_API_KEY!);

    // Nominatim (OpenStreetMap) - GRATUITO
    return new NominatimGeocodingService();
  }
}
```

#### Opções Disponíveis:

**Google Geocoding API**

- Prós: Alta precisão, dados atualizados
- Contras: Requer API Key, tem custo por requisição
- Implementação: `GoogleGeocodingService`

**Nominatim (OpenStreetMap)**

- Prós: Gratuito, sem limites
- Contras: Pode ter dados menos atualizados
- Implementação: `NominatimGeocodingService`

### 2. Mapa Estático

Para trocar o serviço de mapa estático, edite o arquivo `src/services/staticMapService.ts`:

```typescript
// Na classe StaticMapServiceFactory, altere a linha:
export class StaticMapServiceFactory {
  static create(): StaticMapService {
    // DESCOMENTE uma das linhas abaixo e COMENTE a atual:

    // Google Static Maps API (requer API Key)
    // return new GoogleStaticMapService(process.env.GOOGLE_API_KEY!);

    // Mapbox Static Images API (requer Access Token)
    // return new MapboxStaticMapService(process.env.MAPBOX_ACCESS_TOKEN!);

    // OpenStreetMap Static Maps - GRATUITO
    return new OSMStaticMapService();
  }
}
```

#### Opções Disponíveis:

**Google Static Maps API**

- Prós: Alta qualidade, múltiplos estilos
- Contras: Requer API Key, tem custo por requisição
- Implementação: `GoogleStaticMapService`

**Mapbox Static Images API**

- Prós: Estilos personalizáveis, boa qualidade
- Contras: Requer Access Token, tem custo por requisição
- Implementação: `MapboxStaticMapService`

**OpenStreetMap Static Maps**

- Prós: Gratuito, sem limites
- Contras: Estilo limitado
- Implementação: `OSMStaticMapService`

## Configuração de Variáveis de Ambiente

Se optar por serviços pagos, adicione as variáveis no arquivo `.env`:

```env
# Para Google APIs
GOOGLE_API_KEY=sua_chave_api_aqui

# Para Mapbox
MAPBOX_ACCESS_TOKEN=seu_token_aqui
```

## Testando a Mudança

Após trocar o serviço:

1. Reinicie o servidor backend
2. Teste a geração de um dossiê PDF de uma entrega com coordenadas
3. Verifique se o endereço e mapa estão sendo gerados corretamente

## Limitações dos Serviços Gratuitos

### Nominatim (Geocodificação)

- Rate limit: 1 requisição por segundo
- User-Agent obrigatório
- Dados podem não estar 100% atualizados

### OpenStreetMap Static Maps

- Rate limit: Sem limite específico
- Estilo limitado
- Pode ter instabilidade ocasional

## Monitoramento

Os serviços incluem tratamento de erros e logs. Verifique os logs do servidor para identificar problemas:

```bash
# Logs de erro de geocodificação
console.error('Erro ao obter endereço:', error);

# Logs de erro de mapa
console.error('Erro ao carregar mapa:', error);
```
