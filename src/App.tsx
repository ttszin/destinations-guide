import { useState } from 'react';
import axios from 'axios';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

// Interface para os dados do clima (agora com coordenadas)
interface WeatherData {
  name: string;
  main: {
    temp: number;
  };
  weather: {
    description: string;
  }[];
  coord: {
    lat: number;
    lon: number;
  };
}

// Estilos para o container do mapa
const containerStyle = {
  width: '600px',
  height: '400px'
};

function App() {
  const [cidade, setCidade] = useState("");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Novo estado para guardar o centro do mapa
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Hook da biblioteca para carregar a API do Google Maps
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleApiKey
  });

  const handleBusca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cidade) return;

    setLoading(true);
    setWeatherData(null);
    setError(null);
    setMapCenter(null);

    const openWeatherApiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

    try {
      const response = await axios.get<WeatherData>(
        `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${openWeatherApiKey}&units=metric&lang=pt_br`
      );
      setWeatherData(response.data);
      // Salva as coordenadas da resposta da API de clima!
      setMapCenter({ lat: response.data.coord.lat, lng: response.data.coord.lon });
    } catch (err) {
      setError("Cidade não encontrada. Tente novamente.");
      console.error("Erro ao buscar dados do clima:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Guia de Destinos</h1>
      <form onSubmit={handleBusca}>
        <input
          type="text"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          placeholder="Digite o nome de uma cidade"
        />
        <button type="submit">Buscar</button>
      </form>

      {loading && <p>Carregando...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {weatherData && (
        <div>
          <h2>Clima em {weatherData.name}</h2>
          <p>Temperatura: {weatherData.main.temp}°C</p>
          <p>Condição: {weatherData.weather[0].description}</p>
        </div>
      )}

      {/* Renderiza o mapa somente se o script foi carregado e temos um centro definido */}
      {isLoaded && mapCenter && (
        <div style={{ marginTop: '20px' }}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter}
            zoom={13}
          >
            {/* Futuramente, adicionaremos marcadores aqui */}
          </GoogleMap>
        </div>
      )}
    </div>
  );
}

export default App;