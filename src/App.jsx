import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell, ReferenceLine, ReferenceArea, Label
} from 'recharts';
import {
  Activity, Info, Flame, Binary, Sparkles, Hash, Sigma, Grid3X3, LayoutGrid, Thermometer,
  Snowflake, ClipboardCheck, ShieldCheck, CheckCircle2, Calculator, Wand2, RefreshCcw,
  Check, AlertTriangle, XCircle, Sparkle
} from 'lucide-react';
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
 * [FERRAMENTA] SIMULADOR DE APOSTA
 * =================================================================================
 */
const BetSimulator = ({ termometroData }) => {
  const [bet, setBet] = useState(["", "", "", "", "", ""]);
  const PRIMOS = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59];
  const FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55];

  const handleInput = (val, index) => {
    if (val !== "" && (isNaN(val) || val < 1 || val > 60)) return;
    const newBet = [...bet];
    newBet[index] = val;
    setBet(newBet);
  };

  const clearBet = () => setBet(["", "", "", "", "", ""]);

  const analysis = useMemo(() => {
    const nums = bet.map(n => parseInt(n)).filter(n => !isNaN(n));
    if (nums.length < 6) return null;

    const soma = nums.reduce((a, b) => a + b, 0);
    let somaStatus = (soma >= 143 && soma <= 223) ? "safe" : (soma >= 103 && soma <= 263 ? "warning" : "risk");
    const pares = nums.filter(n => n % 2 === 0).length;
    let parStatus = (pares >= 2 && pares <= 4) ? "safe" : "risk";
    const linhasUsadas = new Set(nums.map(n => Math.ceil(n / 10)));
    const colunasUsadas = new Set(nums.map(n => n % 10));
    const emptyLines = 6 - linhasUsadas.size;
    const emptyCols = 10 - colunasUsadas.size;
    let lineStatus = (emptyLines >= 1 && emptyLines <= 2) ? "safe" : "warning";
    let colStatus = (emptyCols >= 4 && emptyCols <= 5) ? "safe" : "warning";

    const getQuad = (n) => {
      if (n % 10 === 0) return n <= 30 ? 2 : 4;
      if (n <= 30) return (n % 10 >= 1 && n % 10 <= 5) ? 1 : 2;
      return (n % 10 >= 1 && n % 10 <= 5) ? 3 : 4;
    };
    const quadsCount = [0, 0, 0, 0, 0];
    nums.forEach(n => quadsCount[getQuad(n)]++);
    const emptyQuads = quadsCount.slice(1).filter(q => q === 0).length;

    let quadStatus = (emptyQuads === 1) ? "safe" : (emptyQuads === 0 ? "warning" : "risk");
    let quadText = emptyQuads === 1 ? "1 Vazio (Ideal)" : (emptyQuads === 0 ? "Sem Vazio" : `${emptyQuads} Vazios (Conc.)`);

    const qtdPrimos = nums.filter(n => PRIMOS.includes(n)).length;
    const qtdFib = nums.filter(n => FIBONACCI.includes(n)).length;
    let primoStatus = qtdPrimos <= 2 ? "safe" : (qtdPrimos === 3 ? "warning" : "risk");
    let fibStatus = qtdFib <= 1 ? "safe" : (qtdFib === 2 ? "warning" : "risk");

    const hotColdAnalysis = nums.map(n => {
      const stat = termometroData.find(t => t.num === n);
      if (!stat) return null;
      if (stat.freqLast20 >= 3) return { num: n, type: 'hot', val: stat.freqLast20 };
      if (stat.lag >= 15) return { num: n, type: 'cold', val: stat.lag };
      return null;
    }).filter(x => x !== null);

    const getPoints = (status) => status === "safe" ? 1 : (status === "warning" ? 0.5 : 0);
    let totalScore = (getPoints(somaStatus) * 2) + (getPoints(parStatus) * 2) + (getPoints(lineStatus) * 1.5) + (getPoints(colStatus) * 1.5) + (getPoints(quadStatus) * 1.5) + getPoints(primoStatus) + getPoints(fibStatus);
    const finalScore = Math.round((totalScore / 10.5) * 100);

    return { soma, somaStatus, pares, parStatus, qtdPrimos, primoStatus, qtdFib, fibStatus, emptyLines, lineStatus, emptyCols, colStatus, emptyQuads, quadStatus, quadText, hotColdAnalysis, finalScore };
  }, [bet, termometroData]);

  const StatusBadge = ({ status, text }) => {
    const colors = { safe: "bg-emerald-100 text-emerald-700 border-emerald-200", warning: "bg-amber-100 text-amber-700 border-amber-200", risk: "bg-rose-100 text-rose-700 border-rose-200" };
    return (
      <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-bold ${colors[status]}`}>
        {status === 'safe' ? <CheckCircle2 size={14} /> : (status === 'warning' ? <AlertTriangle size={14} /> : <XCircle size={14} />)} {text}
      </span>
    );
  };

  const ScoreBar = ({ score }) => {
    let color = score >= 80 ? "bg-emerald-500" : (score >= 50 ? "bg-amber-500" : "bg-rose-500");
    let text = score >= 80 ? "Jogo Profissional" : (score >= 50 ? "Jogo Razoável" : "Jogo Zebra");
    return (
      <div className="w-full bg-slate-800 rounded-xl p-4 border border-slate-700 mb-6 flex items-center gap-4">
        <div className="bg-slate-900 p-3 rounded-full border border-slate-600">
          <span className={`text-xl font-black ${score >= 80 ? 'text-emerald-400' : (score >= 50 ? 'text-amber-400' : 'text-rose-400')}`}>{score}%</span>
        </div>
        <div className="flex-1">
          <div className="flex justify-between mb-1"><span className="text-xs font-bold text-slate-300 uppercase">Qualidade Estatística</span><span className="text-xs font-bold text-white">{text}</span></div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${color}`} style={{ width: `${score}%` }} /></div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 rounded-[24px] p-6 mb-12 shadow-xl border border-slate-700 text-white">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-6">
        <div className="flex items-center gap-3"><div className="p-2 bg-indigo-500 rounded-lg"><Calculator className="text-white" size={20} /></div><div><h3 className="text-lg font-bold">Simulador</h3><p className="text-slate-400 text-xs">Teste seus números</p></div></div>
        <div className="flex gap-2">
          {bet.map((val, i) => (
            <input key={i} type="number" value={val} onChange={(e) => handleInput(e.target.value, i)} className="w-12 h-12 bg-slate-800 border border-slate-600 rounded-lg text-center text-lg font-bold text-white focus:border-indigo-400 outline-none" placeholder="00" />
          ))}
          <button onClick={clearBet} className="ml-2 p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"><RefreshCcw size={18} /></button>
        </div>
      </div>
      {analysis ? (
        <div className="animate-in fade-in slide-in-from-top-2">
          <ScoreBar score={analysis.finalScore} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 flex flex-col justify-between"><span className="text-[10px] text-slate-400 uppercase font-bold">Soma</span><div><span className="text-xl font-black text-white block">{analysis.soma}</span><StatusBadge status={analysis.somaStatus} text={analysis.somaStatus === 'safe' ? "Ideal" : "Extremo"} /></div></div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 flex flex-col justify-between"><span className="text-[10px] text-slate-400 uppercase font-bold">Par / Ímpar</span><div><span className="text-xl font-black text-white block">{analysis.pares}P/{6-analysis.pares}Í</span><StatusBadge status={analysis.parStatus} text={analysis.parStatus === 'safe' ? "Equilibrado" : "Desbalanço"} /></div></div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 flex flex-col justify-between"><span className="text-[10px] text-slate-400 uppercase font-bold">Vazios</span><div className="text-xs space-y-1"><div>{analysis.emptyLines}L Vazias</div><div>{analysis.emptyCols}C Vazias</div></div></div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 flex flex-col justify-between"><span className="text-[10px] text-slate-400 uppercase font-bold">Quadrantes</span><div><span className="text-xl font-black text-white block">{4-analysis.emptyQuads} Usados</span><StatusBadge status={analysis.quadStatus} text={analysis.quadText} /></div></div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 flex flex-col justify-between"><span className="text-[10px] text-slate-400 uppercase font-bold">Especiais</span><div className="text-xs"><div>{analysis.qtdPrimos} Primos</div><div>{analysis.qtdFib} Fib</div></div></div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 flex flex-col justify-start overflow-y-auto max-h-[100px]"><span className="text-[10px] text-slate-400 uppercase font-bold mb-1">Temperatura</span>{analysis.hotColdAnalysis.map((hc, idx) => (<div key={idx} className="flex items-center justify-between text-xs bg-slate-900/50 p-1 rounded mb-1"><span className="font-bold">#{String(hc.num).padStart(2,'0')}</span><span className={hc.type === 'hot' ? 'text-rose-400' : 'text-cyan-400'}>{hc.type === 'hot' ? '🔥' : '❄️'}</span></div>))}</div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 bg-slate-800/30 rounded-xl border border-slate-700 border-dashed flex items-center justify-center gap-2"><Wand2 className="text-slate-600" size={18} /><p className="text-slate-500 text-sm font-medium">Preencha os 6 números para ver seu Score.</p></div>
      )}
    </div>
  );
};

const ChecklistValidator = () => (
    <div className="bg-indigo-900 rounded-[40px] p-8 md:p-12 shadow-2xl mb-16 relative overflow-hidden text-white">
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform rotate-12"><ClipboardCheck size={400} /></div>
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-10 border-b border-indigo-700/50 pb-8"><div className="p-4 bg-indigo-500 rounded-2xl"><ShieldCheck size={32} /></div><div><h3 className="text-3xl font-black">Checklist de Ouro</h3><p className="text-indigo-200 text-sm">Validar estes 3 pilares estatísticos.</p></div></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-indigo-800/50 rounded-3xl p-6 border border-indigo-700">
            <h4 className="text-lg font-bold text-amber-300 mb-4">1. A Base Numérica</h4>
            <ul className="space-y-4 text-sm text-indigo-100">
              <li><b>Soma:</b> Entre 143 e 223.</li>
              <li><b>Paridade:</b> Ideal é 3P/3Í.</li>
            </ul>
          </div>
          <div className="bg-indigo-800/50 rounded-3xl p-6 border border-indigo-700">
            <h4 className="text-lg font-bold text-emerald-300 mb-4">2. Distribuição Espacial</h4>
            <ul className="space-y-4 text-sm text-indigo-100">
              <li><b>Vazios:</b> 1-2 linhas e 4-5 colunas vazias.</li>
              <li><b>Quadrantes:</b> Padrão 3-2-1-0.</li>
            </ul>
          </div>
          <div className="bg-indigo-800/50 rounded-3xl p-6 border border-indigo-700">
            <h4 className="text-lg font-bold text-rose-300 mb-4">3. O Toque Final</h4>
            <ul className="space-y-4 text-sm text-indigo-100">
              <li><b>Especiais:</b> Max 2 Primos e 1 Fib.</li>
              <li><b>Hot/Cold:</b> Max 1 quente e 1 frio.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
);

const ChartSoma = ({ data }) => {
  const VIEW_MIN = 40; const VIEW_MAX = 326;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 border-b border-slate-100 pb-16">
      <div className="lg:col-span-1">
        <SectionHeader title="A Gravidade do Centro" subtitle="A matemática prefere o equilíbrio. A 'Zona Segura' concentra 68% dos sorteios." icon={Sigma} colorClass="text-indigo-900" />
      </div>
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
            <XAxis dataKey="name" type="number" domain={[VIEW_MIN, VIEW_MAX]} hide />
            <Tooltip content={<CustomTooltip prefix="Soma:" />} />
            <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fill="#6366f1" fillOpacity={0.2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ChartParImpar = ({ data, probSegura }) => (
    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 mb-16">
      <div className="flex flex-col lg:flex-row gap-12 items-center">
        <div className="lg:w-1/3">
          <SectionHeader title="A Lei da Simetria" subtitle="A aleatoriedade real tende ao equilíbrio." icon={Hash} />
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
             <span className="text-4xl font-black text-indigo-600">{probSegura}%</span>
             <p className="text-sm text-indigo-800">Jogos com 2, 3 ou 4 pares.</p>
          </div>
        </div>
        <div className="lg:w-2/3 w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" tickFormatter={(val) => `${val}P`} />
              <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
);

const ChartPrimosFib = ({ dataPrimos, dataFib }) => (
    <div className="mb-16 border-b border-slate-100 pb-16">
      <div className="max-w-3xl mb-10"><h3 className="text-2xl font-black text-slate-800 uppercase">Números <span className="text-amber-500">Especiais</span></h3><p className="text-slate-500 text-sm">Primos e Fibonacci são essenciais, mas desastrosos em excesso.</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] border h-80"><ResponsiveContainer><BarChart data={dataPrimos}><XAxis dataKey="name"/><Bar dataKey="value" fill="#f59e0b" radius={4}/></BarChart></ResponsiveContainer></div>
        <div className="bg-white p-8 rounded-[32px] border h-80"><ResponsiveContainer><BarChart data={dataFib}><XAxis dataKey="name"/><Bar dataKey="value" fill="#10b981" radius={4}/></BarChart></ResponsiveContainer></div>
      </div>
    </div>
);

const ChartQuadrantes = ({ dataAssinatura }) => {
  const renderMiniVolante = () => {
    const getQuad = (n) => {
      if (n % 10 === 0) return n <= 30 ? 2 : 4;
      if (n <= 30) return (n % 10 >= 1 && n % 10 <= 5) ? 1 : 2;
      return (n % 10 >= 1 && n % 10 <= 5) ? 3 : 4;
    };
    const colors = { 1: 'bg-indigo-500', 2: 'bg-pink-500', 3: 'bg-emerald-500', 4: 'bg-slate-600' };
    return (
      <div className="relative p-8 bg-slate-800/50 rounded-3xl border border-slate-700/50 mt-6">
        <div className="grid grid-cols-10 gap-2 flex-1">
            {Array.from({ length: 60 }, (_, i) => i + 1).map(num => (
              <div key={num} className={`aspect-square rounded flex items-center justify-center text-[10px] font-bold text-white ${colors[getQuad(num)]}`}>{num}</div>
            ))}
        </div>
      </div>
    );
  };
  return (
    <div className="bg-white p-10 rounded-[40px] border mb-16">
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="lg:w-1/3 flex flex-col justify-center">
          <h3 className="text-3xl font-black text-slate-800 mb-4 uppercase">Distribuição de <span className="text-indigo-600">Quadrantes</span></h3>
          <p className="text-slate-500 text-sm mb-6">A sorte se divide principalmente entre 2-2-1-1 e 3-2-1-0.</p>
          <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 text-sm text-indigo-900">Estes modelos dominam 65% do histórico.</div>
        </div>
        <div className="lg:w-2/3 bg-slate-900 rounded-[32px] p-8">{renderMiniVolante()}</div>
      </div>
    </div>
  );
};

const ChartLinhasColunas = ({ dataLines, dataCols }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 border-b border-slate-100 pb-16">
      <div className="bg-white p-8 rounded-3xl border h-80"><ResponsiveContainer><BarChart data={dataLines}><XAxis dataKey="name"/><Bar dataKey="value" fill="#6366f1" radius={4}/></BarChart></ResponsiveContainer></div>
      <div className="bg-white p-8 rounded-3xl border h-80"><ResponsiveContainer><BarChart data={dataCols}><XAxis dataKey="name"/><Bar dataKey="value" fill="#ec4899" radius={4}/></BarChart></ResponsiveContainer></div>
    </div>
);

const ChartTermometro = ({ data }) => {
  const topQuentes = [...data].sort((a, b) => b.freqLast20 - a.freqLast20).slice(0, 5);
  const topFrias = [...data].sort((a, b) => b.lag - a.lag).slice(0, 5);
  return (
    <div className="bg-white rounded-[24px] border mb-10 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-100">
        <div className="p-5">
            <div className="flex items-center gap-2 mb-4 text-rose-700 font-bold"><Flame size={16} /> Mais Frequentes</div>
            <div className="grid grid-cols-5 gap-2">{topQuentes.map(s => <div key={s.num} className="bg-rose-50 p-2 rounded text-center font-bold">{s.num}</div>)}</div>
        </div>
        <div className="p-5">
            <div className="flex items-center gap-2 mb-4 text-cyan-700 font-bold"><Snowflake size={16} /> Mais Atrasadas</div>
            <div className="grid grid-cols-5 gap-2">{topFrias.map(s => <div key={s.num} className="bg-cyan-50 p-2 rounded text-center font-bold">{s.num}</div>)}</div>
        </div>
      </div>
    </div>
  );
};

/** * =================================================================================
 * [MAIN] DASHBOARD PRINCIPAL
 * =================================================================================
 */
export default function Dashboard() {
  const [filterVirada, setFilterVirada] = useState(false);

  const filteredData = useMemo(() => {
    if (!rawData) return [];
    return rawData.filter(game => filterVirada ? String(game.tipo).toUpperCase() === 'VIRADA' : true);
  }, [filterVirada]);

  const stats = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return { soma: [], primos: [], fib: [], assinatura: [], pares: [], lines: [], cols: [], termometro: [], probPares: 0, total: 0 };
    const total = filteredData.length;
    const distSoma = {}; const distPrimos = {}; const distFib = {}; const distAssinatura = {}; const distLines = {}; const distCols = {};
    const distPares = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    filteredData.forEach(g => {
      const bSoma = Math.floor(g.analises.soma / 10) * 10;
      distSoma[bSoma] = (distSoma[bSoma] || 0) + 1;
      distPrimos[g.analises.primos] = (distPrimos[g.analises.primos] || 0) + 1;
      distFib[g.analises.fibonacci] = (distFib[g.analises.fibonacci] || 0) + 1;
      distAssinatura[g.analises.quadrantes.assinatura] = (distAssinatura[g.analises.quadrantes.assinatura] || 0) + 1;
      distPares[g.analises.pares]++;
      distLines[g.analises.linhas_vazias] = (distLines[g.analises.linhas_vazias] || 0) + 1;
      distCols[g.analises.colunas_vazias] = (distCols[g.analises.colunas_vazias] || 0) + 1;
    });

    const numbersStats = Array.from({ length: 60 }, (_, i) => ({ num: i + 1, freqLast20: 0, lag: 0 }));
    filteredData.slice(0, 20).forEach(g => g.dezenas.forEach(d => numbersStats[Number(d)-1].freqLast20++));
    numbersStats.forEach(stat => {
      const idx = filteredData.findIndex(g => g.dezenas.map(d => Number(d)).includes(stat.num));
      stat.lag = idx === -1 ? total : idx;
    });

    const format = (obj) => Object.entries(obj).map(([name, value]) => ({ name, value, percent: ((value / total) * 100).toFixed(1) })).sort((a, b) => Number(a.name) - Number(b.name));
    return { soma: format(distSoma), primos: format(distPrimos), fib: format(distFib), assinatura: format(distAssinatura).sort((a,b)=>b.value-a.value).slice(0,5), pares: format(distPares), lines: format(distLines), cols: format(distCols), termometro: numbersStats, probPares: (((distPares[2]+distPares[3]+distPares[4])/total)*100).toFixed(1), total };
  }, [filteredData]);

  if (!rawData || rawData.length === 0) return <div>Erro de dados.</div>;

  return (
    <div className="min-h-screen bg-[#FDFDFF] text-slate-900 pb-20 font-sans">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3"><Activity className="text-indigo-600" /><div><h1 className="text-xl font-black uppercase">PrintFlow <span className="text-indigo-600">Analytics</span></h1></div></div>
          <button onClick={() => setFilterVirada(!filterVirada)} className={`px-5 py-2 rounded-full text-xs font-bold ${filterVirada ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-500'}`}>{filterVirada ? '✨ MODO VIRADA' : 'MOSTRAR SÓ VIRADA'}</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="bg-indigo-900 rounded-3xl p-10 mb-12 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-4xl">
            <h2 className="text-3xl font-bold mb-6">Quando seis números se encontram, a aleatoriedade muda de forma.</h2>
            <div className="space-y-4 text-indigo-50 text-lg leading-relaxed">
              <p>Cada número tem a mesma chance. Investigamos como os <b>conjuntos</b> se comportam.</p>
              <p>Foram analisados <b>{stats.total} concursos</b> para oferecer contexto estatístico.</p>
            </div>
          </div>
        </div>

        <ChartSoma data={stats.soma} />
        <ChartParImpar data={stats.pares} probSegura={stats.probPares} />
        <ChartPrimosFib dataPrimos={stats.primos} dataFib={stats.fib} />
        <ChartLinhasColunas dataLines={stats.lines} dataCols={stats.cols} />
        <ChartQuadrantes dataAssinatura={stats.assinatura} />
        <ChartTermometro data={stats.termometro} />
        <ChecklistValidator />
        <BetSimulator termometroData={stats.termometro} />
      </main>

      <footer className="max-w-7xl mx-auto px-6 border-t pt-10 text-center text-slate-400 text-sm">
        Dashboard by Regina Beretta
      </footer>
    </div>
  );
}