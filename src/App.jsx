// import './App.css'
// import "tailwindcss/tailwind.css"
import rawData from './mega_sena_data.json';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Trophy, Activity, Sigma, Hash, Calendar, Filter } from 'lucide-react';

// --- CORES DO TEMA ---
const COLORS = {
  primary: '#6366f1', // Indigo
  secondary: '#ec4899', // Pink
  accent: '#10b981', // Emerald
  slate: '#64748b',
  chart: ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F']
};

const Card = ({ title, icon: Icon, value, subtext }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
      <div className="p-2 bg-indigo-50 rounded-lg">
        <Icon size={20} className="text-indigo-600" />
      </div>
    </div>
    <div className="text-3xl font-bold text-slate-800">{value}</div>
    {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
  </div>
);

const ChartBox = ({ title, children, description }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-96">
    <div className="mb-6">
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      {description && <p className="text-sm text-slate-400">{description}</p>}
    </div>
    <div className="flex-1 w-full min-h-0">
      {children}
    </div>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [filterVirada, setFilterVirada] = useState(false);
  const [yearRange, setYearRange] = useState("all"); // 'all', '2025', '2024'

  // Carrega os dados (Simulando load)
  useEffect(() => {
    // AQUI VOCÊ VAI FAZER O FETCH OU IMPORT REAL
    setData(rawData); 
  }, []);

  // --- LÓGICA DE FILTRO E CÁLCULOS ---
  const filteredData = useMemo(() => {
    return data.filter(game => {
      if (filterVirada && String(game.tipo).toUpperCase() !== 'VIRADA') return false;
      if (yearRange !== 'all') {
        return game.data.startsWith(yearRange);
      }
      return true;
    });
  }, [data, filterVirada, yearRange]);

  const kpis = useMemo(() => {
    if (filteredData.length === 0) return { total: 0, avgSoma: 0, topDezena: '-' };
    
    const total = filteredData.length;
    const somaTotal = filteredData.reduce((acc, curr) => acc + curr.analises.soma, 0);
    
    // Calcular dezena mais frequente
    const counts = {};
    filteredData.forEach(game => {
      // Verifica se dezenas existe (mock data as vezes falha)
      if(game.dezenas) game.dezenas.forEach(n => counts[n] = (counts[n] || 0) + 1);
    });
    const topDezena = Object.entries(counts).sort((a,b) => b[1] - a[1])[0];

    return {
      total,
      avgSoma: Math.round(somaTotal / total),
      topDezena: topDezena ? `#${topDezena[0]}` : '-'
    };
  }, [filteredData]);

  // Preparar dados para Gráficos
  
  // 1. Curva de Sino (Soma)
  const somaData = useMemo(() => {
    const buckets = {};
    // Cria buckets de 10 em 10 (120, 130, 140...)
    filteredData.forEach(game => {
      const bucket = Math.floor(game.analises.soma / 10) * 10;
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    });
    return Object.entries(buckets)
      .map(([range, count]) => ({ name: range, count }))
      .sort((a,b) => Number(a.name) - Number(b.name));
  }, [filteredData]);

  // 2. Assinatura Quadrantes
  const assinaturaData = useMemo(() => {
    const counts = {};
    filteredData.forEach(game => {
      const sig = game.analises.quadrantes.assinatura || "Outros";
      counts[sig] = (counts[sig] || 0) + 1;
    });
    // Pega só os top 5 para não poluir
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredData]);

  // 3. Colunas Vazias
  const colunasData = useMemo(() => {
    const counts = {};
    filteredData.forEach(game => {
      const qtd = game.analises.colunas_vazias;
      counts[qtd] = (counts[qtd] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: `${name} Vazias`, value }));
  }, [filteredData]);

  // 4. Pares vs Ímpares (Geral)
  const parImparData = useMemo(() => {
    let pares = 0;
    let impares = 0;
    filteredData.forEach(g => {
      pares += g.analises.pares;
      impares += g.analises.impares;
    });
    return [
      { name: 'Pares', value: pares },
      { name: 'Ímpares', value: impares }
    ];
  }, [filteredData]);


  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Activity className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              PrintFlow Analytics
            </h1>
          </div>
          <div className="text-sm text-slate-400 hidden sm:block">
            by <span className="font-semibold text-indigo-500">Rebeca Beretta</span>
          </div>
        </div>
      </header>

      {/* CONTROLS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-8">
          <div className="flex items-center gap-2 text-slate-600">
            <Filter size={18} />
            <span className="font-medium">Filtros:</span>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setFilterVirada(!filterVirada)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filterVirada 
                ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-500 ring-offset-2' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ✨ Só Mega da Virada
            </button>
            
            <select 
              value={yearRange} 
              onChange={(e) => setYearRange(e.target.value)}
              className="px-4 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-600 border-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todo o Período</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              {/* Adicionar mais anos conforme necessário */}
            </select>
          </div>
        </div>

        {/* KPI GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card 
            title="Jogos Analisados" 
            value={kpis.total} 
            icon={Hash} 
            subtext={filterVirada ? "Apenas sorteios especiais" : "Base histórica completa"}
          />
          <Card 
            title="Soma Média" 
            value={kpis.avgSoma} 
            icon={Sigma} 
            subtext="Intervalo ideal: 160 - 200"
          />
          <Card 
            title="Dezena Mais Quente" 
            value={kpis.topDezena} 
            icon={Trophy} 
            subtext="Maior ocorrência no período"
          />
        </div>

        {/* CHARTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* CURVA DE SINO */}
          <ChartBox 
            title="A Curva Normal (Somas)" 
            description="Distribuição da soma das 6 dezenas. Note o formato de sino."
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={somaData}>
                <defs>
                  <linearGradient id="colorSoma" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#94a3b8" />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value) => [`${value} jogos`, 'Frequência']}
                />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSoma)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>

          {/* ASSINATURA QUADRANTES */}
          <ChartBox 
            title="Padrões de Quadrantes" 
            description="Frequência das configurações (ex: 3-2-1-0 significa um quadrante vazio)."
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assinaturaData} layout="vertical" margin={{left: 20}}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={60} tick={{fontSize: 12, fontWeight: 600}} stroke="#64748b" />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px'}} />
                <Bar dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>

          {/* COLUNAS VAZIAS */}
          <ChartBox 
            title="Paradoxo das Colunas" 
            description="Quantas colunas ficam vazias por jogo? (5 vazias = Repetição de final)."
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={colunasData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#94a3b8" />
                <YAxis hide />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px'}} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>

          {/* PARES E ÍMPARES */}
          <ChartBox 
            title="Equilíbrio Par/Ímpar" 
            description="Distribuição total acumulada no período selecionado."
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={parImparData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {parImparData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#f43f5e'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>

        </div>
      </div>
      
      <footer className="text-center text-slate-400 py-8 text-sm">
        <p>© 2025 PrintFlow Analytics • Desenvolvido por <a href="https://reberetta.com.br" className="text-indigo-500 hover:underline">Rebeca Beretta</a></p>
      </footer>
    </div>
  );
}