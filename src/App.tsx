import { useState } from 'react';
import axios from 'axios';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { FaSearch, FaThermometerHalf, FaCloud, FaMapMarkerAlt, FaMapMarkedAlt, FaWikipediaW } from 'react-icons/fa';

import './App.css';

// --- Interfaces ---
interface WeatherData {
  name: string;
  main: { temp: number };
  weather: { description: string }[];
  coord: { lat: number; lon: number };
}

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

// --- Tipagem para a Resposta da Wikipedia ---
interface WikiPage {
  pageid: number;
  title: string;
  extract: string;
  pageprops?: { // <-- MUDANÇA AQUI: Adicionamos a propriedade opcional
    disambiguation?: string;
  };
}

interface WikiQueryResult {
  pages: {
    [pageId: string]: WikiPage;
  };
}

const containerStyle = { width: '100%', height: '400px' };

function App() {
  const [cidade, setCidade] = useState("");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: -14.235, lng: -51.925 }); // Centro do Brasil
  const [zoom, setZoom] = useState(4);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [wikiExtract, setWikiExtract] = useState<string | null>(null);


  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleApiKey,
    libraries: ['places'],
  });

  const handleBusca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cidade) return;

    setLoading(true);
    setWeatherData(null);
    setError(null);
    setPlaces([]);
    setSelectedPlace(null);
    setWikiExtract(null);

    const openWeatherApiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';

    try {
      // --- 1. Busca Clima ---
      const weatherResponse = await axios.get<WeatherData>(
        `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${openWeatherApiKey}&units=metric&lang=pt_br`
      );
      
      const { coord, name: nomeCidade } = weatherResponse.data;
      const center = { lat: coord.lat, lng: coord.lon };
      
      setWeatherData(weatherResponse.data);
      setMapCenter(center);
      setZoom(13);

      // --- 2. Busca Pontos Turísticos (Google Places) ---
      const placesUrl = `${proxyUrl}https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${center.lat},${center.lng}&radius=5000&type=tourist_attraction&key=${googleApiKey}`;
      
      axios.get<{ results: Place[] }>(placesUrl).then(response => {
        setPlaces(response.data.results);
      }).catch(err => {
        console.error("Erro ao buscar pontos turísticos:", err);
      });

      // --- 3. Busca Curiosidade (Wikipedia) ---
      // <-- MUDANÇA AQUI: Adicionamos 'pageprops' ao parâmetro 'prop'
      const wikiUrl = `${proxyUrl}https://pt.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageprops&exintro=true&explaintext=true&redirects=1&titles=${encodeURIComponent(nomeCidade)}`;
      
      axios.get<{ query: WikiQueryResult }>(wikiUrl).then(response => {
        const pages = response.data.query.pages;
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId]; // <-- MUDANÇA AQUI: Pegamos o objeto da página
        
        if (pageId && page.extract) {
          // <-- MUDANÇA AQUI: Verificamos se a propriedade 'disambiguation' existe
          if (page.pageprops && page.pageprops.disambiguation !== undefined) {
            // É uma página de desambiguação, não fazemos nada.
            console.log("Wikipedia retornou uma página de desambiguação.");
            setWikiExtract(null);
          } else {
            // É um extrato válido, podemos exibir.
            setWikiExtract(page.extract);
          }
        }
      }).catch(err => {
        console.error("Erro ao buscar dados da Wikipedia:", err);
      });

    } catch (err) {
      // Isso é o erro 404 do OpenWeatherMap. Está correto!
      setError("Cidade não encontrada. Tente novamente.");
      console.error("Erro na busca principal:", err);
    } finally {
      setLoading(false); 
    }
  };

  const handlePlaceClick = (place: Place) => {
    const newCenter = place.geometry.location;
    setMapCenter(newCenter);
    setZoom(15);
    setSelectedPlace(place);
  };

  const handleMarkerClick = (place: Place) => {
    setSelectedPlace(place);
  };

  // --- O restante do JSX (return) continua o mesmo ---
  return (
    <div className="app-container">
      <h1><FaMapMarkedAlt style={{ marginRight: '10px' }} />Guia de Destinos</h1>
      
      <form onSubmit={handleBusca} className="search-bar-form">
        <input
          type="text"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          placeholder="Digite o nome de uma cidade"
          className="search-input"
          disabled={loading}
        />
        <button type="submit" className="search-button" disabled={loading}> 
          <FaSearch /> {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {loading && (
        <div className="status-container spinner-container">
          <div className="spinner"></div>
          <p>Buscando dados da cidade...</p>
        </div>
      )}
      {error && <p className="status-container error-message">{error}</p>}

      {!weatherData && !loading && !error && (
        <div className="status-container empty-state">
          <FaMapMarkedAlt size={60} /> 
          <h2>Pronto para a aventura!</h2>
          <p>Pesquise por uma cidade para começar a planejar sua viagem.</p>
        </div>
      )}

      {weatherData && (
        <div className="info-card"> 
          <h2>{weatherData.name}</h2>
          
          {wikiExtract && (
            <p className="wiki-extract">
              <FaWikipediaW className="icon-wiki" /> {wikiExtract}
            </p>
          )}

          <p><FaThermometerHalf className="icon-temp" />Temperatura: {weatherData.main.temp}°C</p>
          <p><FaCloud className="icon-cloud" />Condição: {weatherData.weather[0].description}</p>
        </div>
      )}

      {places.length > 0 && isLoaded && (
        <div className="content-layout"> 
          
          <div className="list-column"> 
            <h3>Pontos Turísticos</h3>
            <ul className="places-list">
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

          <div className="map-column">
            <GoogleMap mapContainerStyle={containerStyle} center={mapCenter} zoom={zoom}>
              {places.map((place) => (
                <MarkerF 
                  key={place.place_id} 
                  position={place.geometry.location} 
                  title={place.name}
                  onClick={() => handleMarkerClick(place)}
                />
              ))}

              {selectedPlace && (
                 <InfoWindowF
                    position={selectedPlace.geometry.location}
                    onCloseClick={() => setSelectedPlace(null)}
                 >
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

export default App;