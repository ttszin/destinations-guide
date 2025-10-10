import { useState } from 'react';
import axios from 'axios';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

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
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <h1>Guia de Destinos Interativo</h1>
      
      {/* --- BLOCO DO FORMULÁRIO COMPLETO --- */}
      <form onSubmit={handleBusca}>
        <input
          type="text"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          placeholder="Digite o nome de uma cidade"
          style={{ padding: '10px', fontSize: '16px' }}
        />
        <button type="submit" style={{ padding: '10px', fontSize: '16px' }}>Buscar</button>
      </form>

      {/* --- BLOCOS DE LOADING E ERRO COMPLETOS --- */}
      {loading && <p>Carregando...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {/* --- BLOCO DO CLIMA COMPLETO --- */}
      {weatherData && (
        <div style={{ margin: '20px 0' }}>
          <h2>Clima em {weatherData.name}</h2>
          <p>Temperatura: {weatherData.main.temp}°C</p>
          <p>Condição: {weatherData.weather[0].description}</p>
        </div>
      )}

      <div style={{ display: 'flex', marginTop: '20px', gap: '20px' }}>
        {/* Coluna da Lista de Lugares */}
        {places.length > 0 && (
          <div style={{ width: '40%', maxHeight: '400px', overflowY: 'auto' }}>
            <h3>Pontos Turísticos</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {places.map((place) => (
                <li key={place.place_id} onClick={() => handlePlaceClick(place)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                  <strong>{place.name}</strong>
                  <br />
                  <small>Nota: {place.rating} ⭐</small>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Coluna do Mapa */}
        {isLoaded && (
          <div style={{ width: '60%' }}>
            <GoogleMap mapContainerStyle={containerStyle} center={mapCenter} zoom={zoom}>
              {places.map((place) => (
                <MarkerF key={place.place_id} position={place.geometry.location} title={place.name} />
              ))}
            </GoogleMap>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;