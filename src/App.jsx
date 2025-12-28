import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, ReferenceLine, ReferenceArea, Label // <--- ADICIONEI O LABEL AQUI
} from 'recharts';
import { 
  Activity, Info, Flame, Binary, Sparkles, Hash, Sigma 
} from 'lucide-react';

// Certifique-se que este arquivo existe e tem dados. 
// Se estiver vazio, a tela pode quebrar também.
import rawData from './mega_sena_data.json'; 

/** * =================================================================================
 * CONFIGURAÇÕES GERAIS
 * =================================================================================
 */
const COLORS = {
  primary: '#6366f1',   // Indigo
  secondary: '#ec4899', // Pink
  accent: '#10b981',    // Emerald
  warning: '#f59e0b',   // Amber
  slate: '#64748b',
  risk: '#94a3b8'       // Cinza Risco
};

/** * =================================================================================
 * COMPONENTES DE UI
 * =================================================================================
 */
const CustomTooltip = ({ active, payload, label, prefix = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-xl border border-slate-100 rounded-lg text-sm">
        <p className="font-bold text-slate-800">{prefix} {label}</p>
        <p className="text-indigo-600 font-semibold">{payload[0].value} ocorrências</p>
        {payload[0].payload.percent && (
          <p className="text-xs text-slate-400 mt-1">{payload[0].payload.percent}% da história</p>
        )}
      </div>
    );
  }
  return null;
};

const SectionHeader = ({ title, subtitle, icon: Icon, colorClass = "text-slate-800" }) => (
  <div className="mb-6">
    <h2 className={`text-2xl font-bold ${colorClass} flex items-center gap-2`}>
      {Icon && <Icon size={24} />}
      {title}
    </h2>
    <p className="text-slate-500 max-w-2xl mt-1 text-sm">{subtitle}</p>
  </div>
);

/** * =================================================================================
 * [GRÁFICO 1] SOMA COM SIGMA (DESVIO PADRÃO)
 * =================================================================================
 */
const ChartSoma = ({ data }) => {
  // Constantes Estatísticas da Mega Sena
  const MEDIA = 183;
  const SIGMA_1_MIN = 143; 
  const SIGMA_1_MAX = 223;
  const SIGMA_2_MIN = 103; 
  const SIGMA_2_MAX = 263;

  // Ticks para forçar o Eixo X a mostrar exatamente esses números
  const boundaryTicks = [SIGMA_2_MIN, SIGMA_1_MIN, MEDIA, SIGMA_1_MAX, SIGMA_2_MAX];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 border-b border-slate-100 pb-16">
      <div className="lg:col-span-1">
        <SectionHeader 
          title="A Curva Normal (Sigma)" 
          subtitle="Visualize instantaneamente onde está a segurança matemática do jogo."
          icon={Sigma}
          colorClass="text-indigo-900"
        />
        <div className="space-y-4 mt-6">
          {/* Legenda Lateral Auxiliar */}
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500"></div>
            <div>
              <span className="text-xs font-bold text-slate-700">Zona Segura (68.2%)</span>
              <p className="text-[10px] text-slate-400">Entre {SIGMA_1_MIN} e {SIGMA_1_MAX}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500"></div>
            <div>
              <span className="text-xs font-bold text-slate-700">Zona de Alerta (13.6%)</span>
              <p className="text-[10px] text-slate-400">Entre {SIGMA_2_MIN}-{SIGMA_1_MIN} e {SIGMA_1_MAX}-{SIGMA_2_MAX}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-rose-500/20 border border-rose-500"></div>
            <div>
              <span className="text-xs font-bold text-slate-700">Zona de Risco (2.1%)</span>
              <p className="text-[10px] text-slate-400">Abaixo de {SIGMA_2_MIN} ou acima de {SIGMA_2_MAX}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="colorSoma" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            
            {/* Eixo X configurado para mostrar os limites exatos */}
            <XAxis 
              dataKey="name" 
              type="number" 
              domain={['dataMin', 'dataMax']} 
              ticks={boundaryTicks}
              tick={{fontSize: 11, fontWeight: 'bold', fill: '#64748b'}} 
              tickFormatter={(val) => val}
              interval={0}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip prefix="Soma:" />} />

            {/* --- ÁREAS DE FUNDO COLORIDAS (ZONAS) --- */}
            
            {/* 1. ZONA EXTREMA (Esquerda) - Risco */}
            <ReferenceArea x1={0} x2={SIGMA_2_MIN} fill="#f43f5e" fillOpacity={0.08}>
               <Label value="2.1%" position="insideBottom" fill="#f43f5e" fontSize={12} fontWeight="bold" offset={10}/>
            </ReferenceArea>
            
            {/* 2. ZONA INTERMEDIÁRIA (Esquerda) - Alerta */}
            <ReferenceArea x1={SIGMA_2_MIN} x2={SIGMA_1_MIN} fill="#f59e0b" fillOpacity={0.12}>
               <Label value="13.6%" position="center" fill="#d97706" fontSize={12} fontWeight="bold"/>
            </ReferenceArea>

            {/* 3. ZONA CENTRAL (Média) - Segura */}
            <ReferenceArea x1={SIGMA_1_MIN} x2={SIGMA_1_MAX} fill="#10b981" fillOpacity={0.15}>
               <Label value="68.2%" position="top" fill="#059669" fontSize={16} fontWeight="900" dy={20}/>
            </ReferenceArea>

            {/* 4. ZONA INTERMEDIÁRIA (Direita) - Alerta */}
            <ReferenceArea x1={SIGMA_1_MAX} x2={SIGMA_2_MAX} fill="#f59e0b" fillOpacity={0.12}>
               <Label value="13.6%" position="center" fill="#d97706" fontSize={12} fontWeight="bold"/>
            </ReferenceArea>

            {/* 5. ZONA EXTREMA (Direita) - Risco */}
            <ReferenceArea x1={SIGMA_2_MAX} x2={400} fill="#f43f5e" fillOpacity={0.08}>
               <Label value="2.1%" position="insideBottom" fill="#f43f5e" fontSize={12} fontWeight="bold" offset={10}/>
            </ReferenceArea>

            {/* Linhas verticais para marcar os limites exatos */}
            <ReferenceLine x={MEDIA} stroke="#6366f1" strokeDasharray="3 3" opacity={0.5} />
            <ReferenceLine x={SIGMA_1_MIN} stroke="#10b981" strokeDasharray="2 2" />
            <ReferenceLine x={SIGMA_1_MAX} stroke="#10b981" strokeDasharray="2 2" />
            <ReferenceLine x={SIGMA_2_MIN} stroke="#f59e0b" strokeDasharray="2 2" />
            <ReferenceLine x={SIGMA_2_MAX} stroke="#f59e0b" strokeDasharray="2 2" />

            {/* O Gráfico de Dados por cima de tudo */}
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#6366f1" 
              strokeWidth={3} 
              fill="url(#colorSoma)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/** * =================================================================================
 * [GRÁFICO 2] PAR / ÍMPAR (HISTOGRAMA)
 * =================================================================================
 */
const ChartParImpar = ({ data, probSegura }) => {
  return (
    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 mb-16">
      <div className="flex flex-col lg:flex-row gap-12 items-center">
        <div className="lg:w-1/3">
          <SectionHeader 
            title="Equilíbrio Par/Ímpar" 
            subtitle="A batalha entre Pares e Ímpares quase sempre termina em empate técnico."
            icon={Hash} 
          />
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 mt-4">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Zona de Segurança</p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-indigo-600">{probSegura}%</span>
              <span className="text-sm font-bold text-indigo-500">dos jogos</span>
            </div>
            <p className="text-sm text-indigo-800 leading-snug">
              Têm uma distribuição equilibrada de <b>2, 3 ou 4</b> números pares.
            </p>
          </div>
          <p className="text-xs text-slate-400 mt-6 italic">
            * Apostar em 6 pares ou 6 ímpares é jogar contra a estatística (acontece em menos de 2% dos casos).
          </p>
        </div>
        <div className="lg:w-2/3 w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{fontSize: 12}} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}P / ${6-val}Í`} 
              />
              <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip prefix="Configuração:" />} />
              <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={40}>
                {data.map((entry, index) => {
                  const n = Number(entry.name);
                  const isSafe = n >= 2 && n <= 4;
                  return <Cell key={index} fill={isSafe ? COLORS.primary : COLORS.risk} fillOpacity={isSafe ? 1 : 0.3} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-center text-[10px] text-slate-400 mt-2 uppercase tracking-widest">Quantidade de Números Pares</p>
        </div>
      </div>
    </div>
  );
};

/** * =================================================================================
 * [GRÁFICO 3] PRIMOS E FIBONACCI
 * =================================================================================
 */
const ChartPrimosFib = ({ dataPrimos, dataFib }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 border-b border-slate-100 pb-16">
      {/* --- CARTÃO PRIMOS --- */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <Binary size={24}/>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Primos</h3>
            <p className="text-sm text-slate-400">Quantidade ideal por jogo</p>
          </div>
        </div>
        
        <div className="w-full h-64 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataPrimos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{fontSize: 12, fill: '#64748b'}} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                cursor={{fill: '#f8fafc'}} 
                content={<CustomTooltip prefix="Qtd Primos:" />} 
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {dataPrimos.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={(entry.name === "1" || entry.name === "2") ? COLORS.warning : "#cbd5e1"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <p className="text-xs text-amber-800 mt-6 bg-amber-50 p-3 rounded-lg border border-amber-100">
          <b>Insight:</b> 66% dos resultados têm apenas <b>1 ou 2 primos</b>.
        </p>
      </div>

      {/* --- CARTÃO FIBONACCI --- */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <Flame size={24}/>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Fibonacci</h3>
            <p className="text-sm text-slate-400">Sequência: 1, 2, 3, 5, 8, 13...</p>
          </div>
        </div>

        <div className="w-full h-64 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataFib} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{fontSize: 12, fill: '#64748b'}} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                cursor={{fill: '#f8fafc'}} 
                content={<CustomTooltip prefix="Qtd Fibonacci:" />} 
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {dataFib.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={(entry.name === "0" || entry.name === "1") ? COLORS.accent : "#cbd5e1"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-emerald-800 mt-6 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
          <b>Insight:</b> O padrão dominante é ter <b>0 ou 1</b> número Fibonacci.
        </p>
      </div>
    </div>
  );
};

/** * =================================================================================
 * [GRÁFICO 4] QUADRANTES COM VOLANTE
 * =================================================================================
 */
const ChartQuadrantes = ({ dataAssinatura }) => {
  const renderMiniVolante = () => {
    const getQuad = (n) => {
       if (n % 10 === 0) return n <= 30 ? 2 : 4; 
       if (n <= 30) return (n % 10 >= 1 && n % 10 <= 5) ? 1 : 2;
       return (n % 10 >= 1 && n % 10 <= 5) ? 3 : 4;
    };
    const colors = { 1: 'bg-indigo-500', 2: 'bg-pink-500', 3: 'bg-emerald-500', 4: 'bg-slate-500' };