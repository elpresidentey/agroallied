'use client';

import { useState, useEffect } from 'react';

export default function ClockWeather() {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState({
    temp: 22,
    condition: 'Partly Cloudy',
    location: 'Lagos'
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Simulate weather data
    const weatherConditions = [
      { temp: 22, condition: 'Partly Cloudy', location: 'Lagos' },
      { temp: 24, condition: 'Sunny', location: 'Lagos' },
      { temp: 20, condition: 'Cloudy', location: 'Lagos' },
      { temp: 18, condition: 'Light Rain', location: 'Lagos' }
    ];

    const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    setWeather(randomWeather);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">
          {/* Clock Widget */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="font-mono text-gray-900">
                {formatTime(time)}
              </div>
            </div>
          </div>

          {/* Weather Widget */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              <div className="text-gray-900">
                {weather.temp}°C
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
