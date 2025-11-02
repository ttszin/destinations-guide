// --- Importações de Bibliotecas ---
import { useState } from 'react'; // Hook principal do React para gerenciar o estado do componente
import axios from 'axios'; // Biblioteca para fazer chamadas de API (requisições HTTP)
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api'; // Componentes para integrar o Google Maps
import { FaSearch, FaThermometerHalf, FaCloud, FaMapMarkerAlt, FaMapMarkedAlt, FaWikipediaW } from 'react-icons/fa'; // Ícones para a UI

// --- Importação de Estilos ---
import './App.css'; // Importa CSS principal da aplicação

// --- Interfaces (Definição de Tipos) ---
// Define a "forma" dos dados que esperamos receber da API do OpenWeatherMap
interface WeatherData {
  name: string;
  main: { temp: number };
  weather: { description: string }[];
  coord: { lat: number; lon: number };
}

// Define a "forma" dos dados de um local da API do Google Places
interface Place {
  place_id: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating: number;
  vicinity: string;
}

// Define a "forma" da resposta da API da Wikipedia
interface WikiPage {
  pageid: number;
  title: string;
  extract: string;
  pageprops?: { // Propriedade opcional para checar desambiguação
    disambiguation?: string;
  };
}

// Define a "forma" do objeto de consulta da Wikipedia
interface WikiQueryResult {
  pages: {
    [pageId: string]: WikiPage;
  };
}

// Estilo do container do mapa (definido aqui pois a biblioteca do Google Maps o utiliza)
const containerStyle = { width: '100%', height: '400px' };

// --- Componente Principal ---
function App() {
  // --- Estados da Aplicação (Gerenciados pelo useState) ---
  //Armazena informações digitadas pelo usuário e recebidas pelas apis
  const [cidade, setCidade] = useState(""); // Armazena o texto que o usuário digita na barra de busca
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null); // Armazena os dados do clima após a busca
  const [loading, setLoading] = useState(false); // Controla se a aplicação está no estado "carregando"
  const [error, setError] = useState<string | null>(null); // Armazena mensagens de erro (ex: cidade não encontrada)
  const [mapCenter, setMapCenter] = useState({ lat: -14.235, lng: -51.925 }); // Armazena as coordenadas do centro do mapa
  const [zoom, setZoom] = useState(4); // Armazena o nível de zoom do mapa
  const [places, setPlaces] = useState<Place[]>([]); // Armazena a lista de pontos turísticos
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null); // Armazena qual local está selecionado (para o InfoWindow)
  const [wikiExtract, setWikiExtract] = useState<string | null>(null); // Armazena o resumo (curiosidade) da Wikipedia

  // --- Configuração das APIs ---
  // Carrega a chave de API do Google de forma segura a partir das variáveis de ambiente
  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Hook da biblioteca do Google Maps que carrega o script da API e confere quando ela está pronta para uso
  // 'isLoaded' se torna 'true' quando o script está pronto para ser usado
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleApiKey,
    libraries: ['places'], // Informa que também queremos usar a funcionalidade "Places" para os pontos turísticos
  });

  // --- Função Principal de Busca (Chamada pelo formulário) ---
  const handleBusca = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede que a página recarregue ao enviar o formulário
    if (!cidade) return; // Se a busca de cidade estiver vazia, não faz nada

    // 1. Reseta os estados para uma nova busca
    setLoading(true); // Ativa o "spinner" de carregamento
    setWeatherData(null);
    setError(null);
    setPlaces([]);
    setSelectedPlace(null);
    setWikiExtract(null);

    // Carrega as chaves de API e o URL do proxy
    const openWeatherApiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/'; // Proxy para evitar erros de CORS

    try {
      // --- API Call 1: OpenWeatherMap (Busca Principal) ---
      // Esta é a chamada "principal". Se ela falhar, a busca inteira para.
      const weatherResponse = await axios.get<WeatherData>(
        `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${openWeatherApiKey}&units=metric&lang=pt_br`
      );
      
      const { coord, name: nomeCidade } = weatherResponse.data;
      const center = { lat: coord.lat, lng: coord.lon };
      
      // Atualiza os estados com os dados do clima e do mapa
      setWeatherData(weatherResponse.data);
      setMapCenter(center);
      setZoom(13);

      // --- API Call 2: Google Places (Busca Secundária) ---
      // Usamos .then() aqui para que ela rode em "segundo plano" e não trave a UI
      const placesUrl = `${proxyUrl}https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${center.lat},${center.lng}&radius=5000&type=tourist_attraction&key=${googleApiKey}`;
      
      axios.get<{ results: Place[] }>(placesUrl).then(response => {
        setPlaces(response.data.results); // Atualiza o estado com os pontos turísticos
      }).catch(err => {
        // Se essa API falhar, apenas logamos o erro, mas o app continua funcionando
        console.error("Erro ao buscar pontos turísticos:", err);
      });

      // --- API Call 3: Wikipedia (Busca Secundária) ---
      // Também roda em "segundo plano". Usamos o nome da cidade retornado pelo OpenWeatherMap para ter a grafia correta.
      const wikiUrl = `${proxyUrl}https://pt.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageprops&exintro=true&explaintext=true&redirects=1&titles=${encodeURIComponent(nomeCidade)}`;
      
      axios.get<{ query: WikiQueryResult }>(wikiUrl).then(response => {
        const pages = response.data.query.pages;
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];
        
        if (pageId && page.extract) {
          // Checagem inteligente: Se a página for de desambiguação, não exibe o extrato
          if (page.pageprops && page.pageprops.disambiguation !== undefined) {
            console.log("Wikipedia retornou uma página de desambiguação.");
            setWikiExtract(null);
          } else {
            setWikiExtract(page.extract); // Atualiza o estado com a curiosidade
          }
        }
      }).catch(err => {
        console.error("Erro ao buscar dados da Wikipedia:", err);
      });

    } catch (err) {
      // Este 'catch' pega erros da chamada *principal* (OpenWeatherMap), como "Cidade não encontrada" (404)
      setError("Cidade não encontrada. Tente novamente.");
      console.error("Erro na busca principal:", err);
    } finally {
      // Este bloco sempre executa, tanto em sucesso quanto em falha
      setLoading(false); // Desativa o "spinner" de carregamento
    }
  };

  // --- Funções de Interação (Cliques) ---

  // Chamada quando o usuário clica em um item da LISTA
  const handlePlaceClick = (place: Place) => {
    const newCenter = place.geometry.location;
    setMapCenter(newCenter); // Centraliza o mapa no local clicado
    setZoom(15); // Dá zoom no local
    setSelectedPlace(place); // Seleciona o local para abrir o InfoWindow
  };

  // Chamada quando o usuário clica em um MARCADOR no mapa
  const handleMarkerClick = (place: Place) => {
    setSelectedPlace(place); // Apenas seleciona o local (abrir o InfoWindow)
  };

  // --- Renderização do Componente (JSX) ---
  return (
    <div className="app-container">
      {/* --- Título --- */}
      <h1><FaMapMarkedAlt style={{ marginRight: '10px' }} />Guia de Destinos</h1>
      
      {/* --- Barra de Busca --- */}
      <form onSubmit={handleBusca} className="search-bar-form">
        <input
          type="text"
          value={cidade} // O valor do input é controlado pelo estado 'cidade'
          onChange={(e) => setCidade(e.target.value)} // Atualiza o estado 'cidade' a cada tecla digitada
          placeholder="Digite o nome de uma cidade"
          className="search-input"
          disabled={loading} // Desabilita o input durante o carregamento
        />
        <button type="submit" className="search-button" disabled={loading}> 
          <FaSearch /> {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {/* --- Seção de Status (Loading, Erro, Vazio) --- */}
      {/* Mostra o spinner se 'loading' for true */}
      {loading && (
        <div className="status-container spinner-container">
          <div className="spinner"></div>
          <p>Buscando dados da cidade...</p>
        </div>
      )}
      {/* Mostra a mensagem de erro se 'error' for true */}
      {error && <p className="status-container error-message">{error}</p>}

      {/* Mostra o "Estado Vazio" se não estiver carregando, não tiver erro e não tiver dados */}
      {!weatherData && !loading && !error && (
        <div className="status-container empty-state">
          <FaMapMarkedAlt size={60} /> 
          <h2>Pronto para a aventura!</h2>
          <p>Pesquise por uma cidade para começar a planejar sua viagem.</p>
        </div>
      )}

      {/* --- Card de Informações (Clima + Wikipedia) --- */}
      {/* Só exibe este bloco se 'weatherData' tiver dados */}
      {weatherData && (
        <div className="info-card"> 
          <h2>{weatherData.name}</h2>
          
          {/* Só exibe a curiosidade se 'wikiExtract' tiver dados */}
          {wikiExtract && (
            <p className="wiki-extract">
              <FaWikipediaW className="icon-wiki" /> {wikiExtract}
            </p>
          )}

          {/* Seção do Clima */}
          <p><FaThermometerHalf className="icon-temp" />Temperatura: {weatherData.main.temp}°C</p>
          <p><FaCloud className="icon-cloud" />Condição: {weatherData.weather[0].description}</p>
        </div>
      )}

      {/* --- Layout Principal (Lista e Mapa) --- */}
      {/* Só exibe este bloco se houver pontos turísticos E o mapa estiver carregado */}
      {places.length > 0 && isLoaded && (
        <div className="content-layout"> 
          
          {/* Coluna da Lista de Lugares */}
          <div className="list-column"> 
            <h3>Pontos Turísticos</h3>
            <ul className="places-list">
              {/* Faz um loop na lista 'places' e renderiza um item para cada local */}
              {places.map((place) => (
                <li key={place.place_id} onClick={() => handlePlaceClick(place)} className="place-item">
                  <div>
                    <FaMapMarkerAlt style={{ color: '#e74c3c' }} />
                    <strong>{place.name}</strong>
                  </div>
                  <small>Nota: {place.rating ? `${place.rating} ⭐` : 'Sem avaliação'}</small>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna do Mapa */}
          <div className="map-column">
            <GoogleMap 
              mapContainerStyle={containerStyle} 
              center={mapCenter} // O centro é controlado pelo estado 'mapCenter'
              zoom={zoom} // O zoom é controlado pelo estado 'zoom'
            >
              {/* Faz um loop na lista 'places' e renderiza um marcador para cada local */}
              {places.map((place) => (
                <MarkerF 
                  key={place.place_id} 
                  position={place.geometry.location} 
                  title={place.name}
                  onClick={() => handleMarkerClick(place)} // Chama a função ao clicar no marcador
                />
              ))}

              {/* Janela de Informação (InfoWindow) */}
              {/* Só exibe se 'selectedPlace' não for nulo */}
              {selectedPlace && (
                 <InfoWindowF
                    position={selectedPlace.geometry.location}
                    onCloseClick={() => setSelectedPlace(null)} // Fecha a janela (define o estado como nulo)
                 >
                   {/* Conteúdo do pop-up */}
                   <div>
                     <strong>{selectedPlace.name}</strong>
                     <p>{selectedPlace.vicinity}</p>
                   </div>
                 </InfoWindowF>
              )}
            </GoogleMap>
          </div>
        </div>
      )}
    </div>
  );
}

export default App; // Exporta o componente App para ser usado pelo main.tsx
