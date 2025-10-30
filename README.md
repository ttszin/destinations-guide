# Guia de Destinos Interativo

Uma aplicação web que permite aos usuários pesquisar por cidades ao redor do mundo e obter informações relevantes para viajantes, como clima em tempo real, um mapa interativo e os principais pontos turísticos da região.

Este projeto foi desenvolvido como parte de um trabalho acadêmico sobre aplicações cliente/servidor que consomem múltiplas APIs.

## Funcionalidades

-   ✅ **Busca Dinâmica:** Pesquise por qualquer cidade do mundo.
-   ✅ **Clima em Tempo Real:** Exibe a temperatura e as condições climáticas atuais.
-   ✅ **Mapa Interativo:** Mostra um mapa do Google Maps centrado na cidade pesquisada.
-   ✅ **Pontos Turísticos:** Exibe marcadores no mapa para as principais atrações turísticas.
-   ✅ **Lista Interativa:** Apresenta uma lista dos pontos turísticos que, ao ser clicada, centraliza e dá zoom no local correspondente no mapa.
-   ✅ **Informações no Mapa:** Ao clicar em um marcador no mapa, uma janela de informações (InfoWindow) é exibida.

## Tecnologias Utilizadas

Este projeto foi construído com tecnologias modernas do ecossistema front-end.

| Ferramenta | Descrição |
| :--- | :--- |
| **React** | Biblioteca principal para a construção da interface de usuário. |
| **TypeScript** | Superset do JavaScript que adiciona tipagem estática para um código mais robusto. |
| **Vite** | Ferramenta de build extremamente rápida para o ambiente de desenvolvimento. |
| **Axios** | Cliente HTTP para fazer as requisições para as APIs externas. |
| **@react-google-maps/api**| Biblioteca para integrar o Google Maps de forma fácil em componentes React. |

### APIs Consumidas

-   **OpenWeatherMap API:** Para obter os dados de clima.
-   **Google Maps API:** Para a renderização do mapa interativo.
-   **Google Places API:** Para buscar os pontos turísticos.

---

## Como Rodar o Projeto Localmente

Siga estas instruções para configurar e executar o projeto no seu computador.

### Pré-requisitos

Antes de começar, certifique-se de que você tem o **Node.js** instalado na sua máquina. A versão LTS é recomendada.

-   [Download do Node.js](https://nodejs.org/)

A instalação do Node.js já inclui o `npm` (Node Package Manager).

### 1. Clonar o Repositório

Primeiro, clone este repositório para a sua máquina local:

```bash
git clone [URL_DO_SEU_REPOSITORIO_GIT]
cd guia-de-destinos
```

### 2. Instalar as Dependências

Com o terminal aberto na pasta raiz do projeto (`guia-de-destinos`), execute o comando abaixo. Ele irá ler o arquivo `package.json` e baixar todas as bibliotecas e pacotes necessários para a pasta `node_modules`.

```bash
npm install 
```

3. Configurar as Chaves de API (Variáveis de Ambiente)
Este é o passo mais importante para que a aplicação possa se comunicar com os serviços externos. Faremos isso de forma segura, sem expor as chaves no código.

3.1. Crie o arquivo de ambiente

Na raiz do projeto, crie um arquivo chamado .env. Você pode fazer isso manualmente ou usando um dos comandos abaixo no seu terminal:

No Windows (CMD ou PowerShell):

Snippet de código

copy NUL .env
No Mac ou Linux:

Bash

touch .env
3.2. Preencha o arquivo .env

Abra o arquivo .env que você acabou de criar e cole o seguinte conteúdo dentro dele:

Ini, TOML

# =================================================
# VARIÁVEIS DE AMBIENTE - GUIA DE DESTINOS
# =================================================

# Chave da API do Google Cloud Platform
# Necessária para Maps JavaScript API e Places API.
# Obtenha em: [https://console.cloud.google.com/](https://console.cloud.google.com/)
VITE_GOOGLE_MAPS_API_KEY="SUA_CHAVE_DO_GOOGLE_VAI_AQUI"

# Chave da API do OpenWeatherMap
# Necessária para os dados de clima.
# Obtenha em: [https://openweathermap.org/](https://openweathermap.org/)
VITE_OPENWEATHER_API_KEY="SUA_CHAVE_DO_OPENWEATHER_VAI_AQUI"
3.3. Adicione suas chaves secretas

Agora, substitua os textos de exemplo ("SUA_CHAVE_..._AQUI") pelas suas chaves de API reais que você gerou nos painéis do Google Cloud e do OpenWeatherMap.

Nota de Segurança: O arquivo .gitignore já está configurado para nunca enviar o arquivo .env para o repositório, garantindo que suas chaves permaneçam seguras e locais na sua máquina.