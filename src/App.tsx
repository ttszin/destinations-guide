import { useState } from 'react';
import axios from 'axios';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
// --- NOVOS IMPORTS DO REACT ICONS (CORRIGIDOS) ---
import { FaSearch, FaThermometerHalf, FaCloud, FaMapMarkerAlt, FaMapMarkedAlt } from 'react-icons/fa'; // FaMapMarkedAlt adicionado

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

const containerStyle = { width: '100%', height: '400px', borderRadius: '10px' };

function App() {
  const [cidade, setCidade] = useState("");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: -14.235, lng: -51.925 }); // Centro do Brasil
  const [zoom, setZoom] = useState(4);
  const [places, setPlaces] = useState<Place[]>([]);
  // const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null); // Estado para destaque de marcador (opcional da Tarefa 3)

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
    // setSelectedPlaceId(null);

    const openWeatherApiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

    try {
      const weatherResponse = await axios.get<WeatherData>(
        `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${openWeatherApiKey}&units=metric&lang=pt_br`
      );
      const { coord } = weatherResponse.data;
      const center = { lat: coord.lat, lng: coord.lon };
      
      setWeatherData(weatherResponse.data);
      setMapCenter(center);
      setZoom(13);

      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const placesUrl = `${proxyUrl}https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${center.lat},${center.lng}&radius=5000&type=tourist_attraction&key=${googleApiKey}`;
      
      const placesResponse = await axios.get<{ results: Place[] }>(placesUrl);
      setPlaces(placesResponse.data.results);

    } catch (err) {
      setError("Cidade não encontrada ou erro ao buscar dados. Tente novamente.");
      console.error("Erro na busca:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceClick = (place: Place) => {
    const newCenter = place.geometry.location;
    setMapCenter(newCenter);
    setZoom(15);
    // setSelectedPlaceId(place.place_id);
  };

  return (
    // Removido style inline para usar estilos do #root no App.css
    <div className="app-container"> {/* Se precisar de um wrapper, use uma classe sem estilos de tamanho */}
      <h1>Guia de Destinos Interativo</h1>
      
      {/* --- BLOCO DO FORMULÁRIO --- */}
      <form onSubmit={handleBusca} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          placeholder="Digite o nome de uma cidade"
          // Melhorando os estilos inline para botões e inputs
          style={{ padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px', marginRight: '10px' }}
        />
        <button 
          type="submit" 
          style={{ padding: '10px 15px', fontSize: '16px', display: 'inline-flex', alignItems: 'center', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: '#3498db', color: 'white' }}
        > 
          <FaSearch style={{ marginRight: '5px' }} /> Buscar 
        </button>
      </form>

      {/* --- BLOCOS DE LOADING E ERRO COMPLETOS --- */}
      {/* SPINNER (TAREFA 4) */}
      {loading && (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Buscando dados da cidade...</p>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {/* --- BLOCO DO CLIMA COMPLETO (WEATHER CARD) --- */}
      {weatherData && (
        // Aplicando a classe para o fade-in e layout (Tarefa 3)
        <div className="weather-card"> 
          <h2>Clima em {weatherData.name}</h2>
          <p style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}><FaThermometerHalf style={{ marginRight: '8px', color: '#e74c3c' }} />Temperatura: {weatherData.main.temp}°C</p>
          <p style={{ display: 'flex', alignItems: 'center' }}><FaCloud style={{ marginRight: '8px', color: '#3498db' }} />Condição: {weatherData.weather[0].description}</p>
        </div>
      )}

      {/* EMPTY STATE (TAREFA 4) - Exibido se não houver dados, erro, ou loading */}
      {(!weatherData && places.length === 0 && !error && !loading) && (
        <div className="empty-state">
          <FaMapMarkedAlt size={60} style={{ color: '#aaa' }} /> 
          <h2>Pronto para a aventura!</h2>
          <p>Pesquise por uma cidade para começar a planejar sua viagem e visualizar o mapa e atrações.</p>
        </div>
      )}


      {/* --- BLOCO DE CONTEÚDO PRINCIPAL (LISTA E MAPA) --- */}
      {/* Aplicando a classe content-layout para a Responsividade (Tarefa 1) */}
      {(weatherData || places.length > 0) && (
        <div className="content-layout"> 
          
          {/* Coluna da Lista de Lugares */}
          {places.length > 0 && (
            // Aplicando a classe list-column para o fade-in e layout
            <div className="list-column"> 
              <h3>Pontos Turísticos</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {places.map((place) => (
                  // Aplicando a classe place-item para o efeito hover (Tarefa 3)
                  <li key={place.place_id} onClick={() => handlePlaceClick(place)} className="place-item">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <FaMapMarkerAlt style={{ marginRight: '5px', color: '#e74c3c' }} />
                      <strong>{place.name}</strong>
                    </div>
                    <small>Nota: {place.rating} ⭐</small>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Coluna do Mapa */}
          {isLoaded && (
            // Aplicando a classe map-column para o fade-in e layout
            <div className="map-column">
              <GoogleMap mapContainerStyle={containerStyle} center={mapCenter} zoom={zoom}>
                {places.map((place) => (
                  <MarkerF key={place.place_id} position={place.geometry.location} title={place.name} />
                ))}
              </GoogleMap>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;