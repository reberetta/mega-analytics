import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell, ReferenceLine, ReferenceArea, Label
} from 'recharts';
import {
  Activity, Info, Flame, Binary, Sparkles, Hash, Sigma, Grid3X3, LayoutGrid, Thermometer,
  Snowflake, ClipboardCheck, ShieldCheck, CheckCircle2, Calculator, Wand2, RefreshCcw, Trash2,
  Check, AlertTriangle, XCircle, AlertCircle
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
 * [FERRAMENTA] SIMULADOR DE APOSTA (NOTA 0-10 + GERADOR ALEATÓRIO)
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

  // Função para gerar jogo aleatório
  const generateRandomBet = () => {
    const numbers = [];
    while (numbers.length < 6) {
      const r = Math.floor(Math.random() * 60) + 1;
      if (!numbers.includes(r)) numbers.push(r);
    }
    setBet(numbers.sort((a, b) => a - b).map(n => String(n)));
  };

  const analysis = useMemo(() => {
    const nums = bet.map(n => parseInt(n)).filter(n => !isNaN(n));
    if (nums.length < 6) return null;

    // 1. Soma
    const soma = nums.reduce((a, b) => a + b, 0);
    let somaStatus = (soma >= 143 && soma <= 223) ? "safe" : (soma >= 103 && soma <= 263 ? "warning" : "risk");

    // 2. Pares
    const pares = nums.filter(n => n % 2 === 0).length;
    let parStatus = (pares >= 2 && pares <= 4) ? "safe" : "risk";

    // 3. Linhas e Colunas
    const linhasUsadas = new Set(nums.map(n => Math.ceil(n / 10)));
    const colunasUsadas = new Set(nums.map(n => n % 10));
    const emptyLines = 6 - linhasUsadas.size;
    const emptyCols = 10 - colunasUsadas.size;
    let lineStatus = (emptyLines >= 1 && emptyLines <= 2) ? "safe" : "warning";
    let colStatus = (emptyCols >= 4 && emptyCols <= 5) ? "safe" : "warning";

    // 4. Quadrantes (REVISADO: 3-2-1-0 ou 2-2-1-1 são Safe)
    const getQuad = (n) => {
      if (n % 10 === 0) return n <= 30 ? 2 : 4;
      if (n <= 30) return (n % 10 >= 1 && n % 10 <= 5) ? 1 : 2;
      return (n % 10 >= 1 && n % 10 <= 5) ? 3 : 4;
    };
    const quadsCount = [0, 0, 0, 0, 0];
    nums.forEach(n => quadsCount[getQuad(n)]++);
    const emptyQuads = quadsCount.slice(1).filter(q => q === 0).length;

    let quadStatus = "risk";
    let quadText = `${emptyQuads} Vazios`;

    if (emptyQuads === 1 || emptyQuads === 0) {
      quadStatus = "safe";
      quadText = emptyQuads === 1 ? "3-2-1-0 (Ideal)" : "2-2-1-1 (Equilíbrio)";
    } else {
      quadStatus = "risk";
      quadText = "Concentrado";
    }

    // 5. Primos & Fib
    const qtdPrimos = nums.filter(n => PRIMOS.includes(n)).length;
    const qtdFib = nums.filter(n => FIBONACCI.includes(n)).length;
    let primoStatus = qtdPrimos <= 2 ? "safe" : (qtdPrimos === 3 ? "warning" : "risk");
    let fibStatus = qtdFib <= 1 ? "safe" : (qtdFib === 2 ? "warning" : "risk");

    // 6. Temperatura (REVISADO: Max 1 de cada)
    const hotNums = nums.filter(n => termometroData.find(t => t.num === n)?.freqLast20 >= 3);
    const coldNums = nums.filter(n => termometroData.find(t => t.num === n)?.lag >= 15);

    let tempStatus = (hotNums.length <= 1 && coldNums.length <= 1) ? "safe" : "warning";

    const hotColdAnalysis = nums.map(n => {
      const stat = termometroData.find(t => t.num === n);
      if (!stat) return null;
      if (stat.freqLast20 >= 3) return { num: n, type: 'hot', val: stat.freqLast20 };
      if (stat.lag >= 15) return { num: n, type: 'cold', val: stat.lag };
      return null;
    }).filter(x => x !== null);

    // SCORE FINAL (0 a 10)
    const getPoints = (status) => status === "safe" ? 1 : (status === "warning" ? 0.5 : 0);
    let totalScore = 0;
    totalScore += getPoints(somaStatus) * 2;
    totalScore += getPoints(parStatus) * 2;
    totalScore += getPoints(lineStatus) * 1.5;
    totalScore += getPoints(colStatus) * 1.5;
    totalScore += getPoints(quadStatus) * 1.5;
    totalScore += getPoints(tempStatus) * 1.5; // Temperatura agora pesa no score

    const finalGrade = (totalScore / 10 * 10).toFixed(1);

    return {
      soma, somaStatus,
      pares, parStatus,
      qtdPrimos, primoStatus,
      qtdFib, fibStatus,
      emptyLines, lineStatus,
      emptyCols, colStatus,
      emptyQuads, quadStatus, quadText,
      hotColdAnalysis,
      tempStatus,
      finalGrade
    };
  }, [bet, termometroData]);

  const StatusBadge = ({ status, text }) => {
    const colors = { safe: "bg-emerald-100 text-emerald-700 border-emerald-200", warning: "bg-amber-100 text-amber-700 border-amber-200", risk: "bg-rose-100 text-rose-700 border-rose-200" };
    const icon = { safe: <CheckCircle2 size={14} />, warning: <AlertTriangle size={14} />, risk: <XCircle size={14} /> };
    return (
      <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold uppercase ${colors[status]}`}>
        {icon[status]} {text}
      </span>
    );
  };

  const ScoreBar = ({ grade }) => {
    const g = parseFloat(grade);
    let color = "bg-rose-500";
    let text = "Jogo Fora de Padrão";
    if (g >= 5) { color = "bg-amber-500"; text = "Jogo Mediano"; }
    if (g >= 8.5) { color = "bg-emerald-500"; text = "Estatisticamente Forte"; }

    return (
      <div className="w-full bg-slate-800 rounded-xl p-4 border border-slate-700 mb-6 flex items-center gap-4">
        <div className="bg-slate-900 p-3 rounded-full border border-slate-600 min-w-[70px] text-center">
          <span className={`text-2xl font-black ${g >= 8.5 ? 'text-emerald-400' : (g >= 5 ? 'text-amber-400' : 'text-rose-400')}`}>
            {grade}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Nota de Qualidade</span>
            <span className="text-xs font-bold text-white uppercase">{text}</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 ease-out ${color}`} style={{ width: `${g * 10}%` }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 rounded-[24px] p-6 mb-12 shadow-xl border border-slate-700 text-white">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-6">
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/50">
            <Calculator className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-none">Simulador</h3>
            <p className="text-slate-400 text-xs tracking-tighter uppercase">Validação de Tendências</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 w-full">
          {/* Container das dezenas - flex-wrap para garantir que os inputs não estourem em telas minúsculas */}
          <div className="flex flex-wrap justify-center gap-2">
            {bet.map((val, i) => (
              <input
                key={i}
                type="number"
                value={val}
                onChange={(e) => handleInput(e.target.value, i)}
                className="w-11 h-11 bg-slate-800 border border-slate-600 rounded-lg text-center text-lg font-bold text-white focus:border-indigo-400 transition-all outline-none"
                placeholder="00"
              />
            ))}
          </div>

          {/* Container dos Botões - w-full no mobile para facilitar o clique, sm:w-auto no desktop */}
          <div className="flex gap-2 w-full sm:w-auto justify-center sm:ml-2">
            <button
              onClick={generateRandomBet}
              className="flex-1 sm:flex-none p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all flex justify-center items-center"
              title="Gerar Jogo Aleatório"
            >
              <Wand2 size={18} />
              <span className="sm:hidden ml-2 text-xs font-bold uppercase">Aleatório</span>
            </button>
            <button
              onClick={clearBet}
              className="flex-1 sm:flex-none p-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all flex justify-center items-center"
              title="Limpar Jogo"
            >
              <Trash2 size={18} />
              <span className="sm:hidden ml-2 text-xs font-bold uppercase">Limpar</span>
            </button>
          </div>
        </div>
      </div>

      {analysis ? (
        <div className="animate-in fade-in duration-500">
          <ScoreBar grade={analysis.finalGrade} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Soma</span>
              <div>
                <span className="text-xl font-black block">{analysis.soma}</span>
                <StatusBadge status={analysis.somaStatus} text={analysis.somaStatus === 'safe' ? "Ok" : "Alerta"} />
              </div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Paridade</span>
              <div>
                <span className="text-xl font-black block">{analysis.pares}P/{6 - analysis.pares}Í</span>
                <StatusBadge status={analysis.parStatus} text={analysis.parStatus === 'safe' ? "Ok" : "Ruído"} />
              </div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Quadrantes</span>
              <div>
                <span className="text-sm font-bold block mb-1">{analysis.quadText}</span>
                <StatusBadge status={analysis.quadStatus} text={analysis.quadStatus === 'safe' ? "Ideal" : "Desequilíbrio"} />
              </div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Vazios</span>
              <div className="space-y-1 mt-1">
                <div className="flex justify-between text-[10px]"><span>L. Vazias</span><span className={analysis.lineStatus === 'safe' ? 'text-emerald-400' : 'text-amber-400'}>{analysis.emptyLines}</span></div>
                <div className="flex justify-between text-[10px]"><span>C. Vazias</span><span className={analysis.colStatus === 'safe' ? 'text-emerald-400' : 'text-amber-400'}>{analysis.emptyCols}</span></div>
              </div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Especiais</span>
              <div className="space-y-1 mt-1">
                <div className="flex justify-between text-[10px]"><span>Primos</span><span className={analysis.primoStatus === 'safe' ? 'text-emerald-400' : 'text-rose-400'}>{analysis.qtdPrimos}</span></div>
                <div className="flex justify-between text-[10px]"><span>Fibon.</span><span className={analysis.fibStatus === 'safe' ? 'text-emerald-400' : 'text-rose-400'}>{analysis.qtdFib}</span></div>
              </div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 flex flex-col justify-start overflow-y-auto max-h-[100px]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Temperatura</span>
                <div className={`w-2 h-2 rounded-full ${analysis.tempStatus === 'safe' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
              </div>
              <div className="space-y-1">
                {analysis.hotColdAnalysis.length === 0 ? <span className="text-[10px] text-slate-500 italic">Neutros</span> :
                  analysis.hotColdAnalysis.map((hc, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[10px] bg-slate-900/50 p-1 rounded">
                      <span className="font-bold">#{String(hc.num).padStart(2, '0')}</span>
                      <span className={hc.type === 'hot' ? 'text-rose-400' : 'text-cyan-400'}>{hc.type === 'hot' ? '🔥' : '❄️'}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 bg-slate-800/30 rounded-xl border border-slate-700 border-dashed">
          <p className="text-slate-500 text-sm font-medium">Insira 6 dezenas ou gere um jogo aleatório para analisar.</p>
        </div>
      )}
    </div>
  );
};

/** * =================================================================================
 * [FECHAMENTO] CHECKLIST DE VALIDAÇÃO
 * =================================================================================
 */
const ChecklistValidator = () => {
  return (
    <div className="bg-indigo-900 rounded-[40px] p-8 md:p-12 shadow-2xl shadow-indigo-200 mb-16 relative overflow-hidden text-white">
      {/* Background Decorativo */}
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform rotate-12">
        <ClipboardCheck size={400} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-10 border-b border-indigo-700/50 pb-8">
          <div className="p-4 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-900/50">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight text-white">Checklist de Ouro</h3>
            <p className="text-indigo-200 text-sm font-medium">Não registre seu jogo sem validar estes 3 pilares estatísticos.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* PILAR 1: SEGURANÇA MATEMÁTICA */}
          <div className="bg-indigo-800/50 rounded-3xl p-6 border border-indigo-700 hover:bg-indigo-800 transition-colors">
            <h4 className="text-lg font-bold text-amber-300 mb-4 flex items-center gap-2">
              1. A Base Numérica
            </h4>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                <span className="text-sm text-indigo-100 leading-snug">
                  <strong className="text-white block">Soma Total:</strong>
                  Seus 6 números somados devem dar entre <b>143 e 223</b>. Fora disso é zebra.
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                <span className="text-sm text-indigo-100 leading-snug">
                  <strong className="text-white block">Equilíbrio Par/Ímpar:</strong>
                  Evite tudo Par ou tudo Ímpar. O ideal é <b>3 pares e 3 ímpares</b> (ou 4/2).
                </span>
              </li>
            </ul>
          </div>

          {/* PILAR 2: ESTRUTURA DO VOLANTE */}
          <div className="bg-indigo-800/50 rounded-3xl p-6 border border-indigo-700 hover:bg-indigo-800 transition-colors">
            <h4 className="text-lg font-bold text-emerald-300 mb-4 flex items-center gap-2">
              2. Distribuição Espacial
            </h4>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                <span className="text-sm text-indigo-100 leading-snug">
                  <strong className="text-white block">O Vazio é Bom:</strong>
                  Deixe <b>1 ou 2 linhas</b> inteiras vazias. Deixe <b>4 ou 5 colunas</b> inteiras vazias. Não espalhe demais.
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                <span className="text-sm text-indigo-100 leading-snug">
                  <strong className="text-white block">Quadrantes (3-2-1-0 ou 2-2-1-1):</strong>
                  Busque o padrão <b>3-2-1-0</b> (deixando um quadrante vazio) ou o <b>2-2-1-1</b> (espalhando com equilíbrio).
                </span>
              </li>
            </ul>
          </div>

          {/* PILAR 3: SINTONIA FINA (A Regra de Ouro) */}
          <div className="bg-indigo-800/50 rounded-3xl p-6 border border-indigo-700 hover:bg-indigo-800 transition-colors">
            <h4 className="text-lg font-bold text-rose-300 mb-4 flex items-center gap-2">
              3. O Toque Final
            </h4>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                <span className="text-sm text-indigo-100 leading-snug">
                  <strong className="text-white block">Primos e Fibonacci:</strong>
                  Tenha no máximo <b>2 primos</b> e no máximo <b>1 fibonacci</b>. Menos é mais aqui.
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                <span className="text-sm text-indigo-100 leading-snug">
                  <strong className="text-white block">Quentes/Frios:</strong>
                  Use <b>no máximo 1 número quente</b> (pra surfar a onda) e/ou <b>no máximo 1 número frio</b> (pra tentar a quebra). O resto do jogo deve ser de números neutros.
                </span>
              </li>

            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};



/** * =================================================================================
 * [GRÁFICO 1] SOMA COM SIGMA (DESVIO PADRÃO) - CURVA COMPLETA
 * =================================================================================
 */
const ChartSoma = ({ data }) => {
  // Constantes Estatísticas da Mega Sena
  const MEDIA = 183;
  const SIGMA_1_MIN = 143;
  const SIGMA_1_MAX = 223;
  const SIGMA_2_MIN = 103;
  const SIGMA_2_MAX = 263;

  // Limites visuais para o gráfico não cortar (deixa a curva "morrer" no eixo)
  const VIEW_MIN = 40;
  const VIEW_MAX = 326;

  // Ticks para forçar o Eixo X a mostrar exatamente esses números
  // Adicionei os limites visuais para o eixo ficar completo
  const boundaryTicks = [VIEW_MIN, SIGMA_2_MIN, SIGMA_1_MIN, MEDIA, SIGMA_1_MAX, SIGMA_2_MAX, VIEW_MAX];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 border-b border-slate-100 pb-16">
      <div className="lg:col-span-1">
        <SectionHeader
          title="A Gravidade do Centro"
          subtitle="Embora qualquer número possa sair, a soma deles raramente foge do meio. 
          Este gráfico mostra a Distribuição Normal: a 'Zona Segura' não é um palpite, 
          é onde 68% dos sorteios da história se concentram. Fuja das extremidades; 
          a matemática prefere o equilíbrio."
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
          {/* Legenda ajustada para Neutro/Risco */}
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-slate-100 border border-slate-300"></div>
            <div>
              <span className="text-xs font-bold text-slate-700">Extremos (2.1%)</span>
              <p className="text-[10px] text-slate-400">Zebras estatísticas (Muito raro)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="colorSoma" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

            {/* Eixo X: Usamos 'type="number"' e definimos o domain manualmente para expandir a visão */}
            <XAxis
              dataKey="name"
              type="number"
              domain={[VIEW_MIN, VIEW_MAX]}
              ticks={boundaryTicks}
              tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
              tickFormatter={(val) => val}
              interval={0}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip prefix="Soma:" />} />

            {/* --- ÁREAS DE FUNDO COLORIDAS (ZONAS) --- */}

            {/* 1. ZONA EXTREMA (Esquerda) - NEUTRA AGORA */}
            {/* Removi o fill color para ficar transparente, mantendo apenas o Label discreto  */}
            <ReferenceArea x1={VIEW_MIN} x2={SIGMA_2_MIN} fill="transparent">
              <Label value="2.1%" position="insideBottom" fill="#cbd5e1" fontSize={12} fontWeight="bold" offset={10} />
            </ReferenceArea>

            {/* 2. ZONA INTERMEDIÁRIA (Esquerda) - Alerta (AMARELO) */}
            <ReferenceArea x1={SIGMA_2_MIN} x2={SIGMA_1_MIN} fill="#f59e0b" fillOpacity={0.12}>
              <Label value="13.6%" position="center" fill="#d97706" fontSize={12} fontWeight="bold" />
            </ReferenceArea>

            {/* 3. ZONA CENTRAL (Média) - Segura (VERDE) */}
            <ReferenceArea x1={SIGMA_1_MIN} x2={SIGMA_1_MAX} fill="#10b981" fillOpacity={0.15}>
              <Label value="68.2%" position="top" fill="#059669" fontSize={16} fontWeight="900" dy={20} />
            </ReferenceArea>

            {/* 4. ZONA INTERMEDIÁRIA (Direita) - Alerta (AMARELO) */}
            <ReferenceArea x1={SIGMA_1_MAX} x2={SIGMA_2_MAX} fill="#f59e0b" fillOpacity={0.12}>
              <Label value="13.6%" position="center" fill="#d97706" fontSize={12} fontWeight="bold" />
            </ReferenceArea>

            {/* 5. ZONA EXTREMA (Direita) - NEUTRA AGORA */}
            <ReferenceArea x1={SIGMA_2_MAX} x2={VIEW_MAX} fill="transparent">
              <Label value="2.1%" position="insideBottom" fill="#cbd5e1" fontSize={12} fontWeight="bold" offset={10} />
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
 * [GRÁFICO 3] PRIMOS E FIBONACCI - REVISADO
 * =================================================================================
 */
const ChartPrimosFib = ({ dataPrimos, dataFib }) => {
  return (
    <div className="mb-16 border-b border-slate-100 pb-16">

      {/* Cabeçalho de Introdução Matemática - Ajustado para largura total */}
      <div className="w-full mb-10">
        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-3">
          Números <span className="text-amber-500">Especiais</span>
        </h3>
        <p className="text-slate-500 leading-relaxed text-sm">
          Primos e Fibonacci são <b>peças fundamentais da aritmética</b>. Na Mega-Sena, eles funcionam como um tempero: essenciais para o equilíbrio, mas desastrosos em excesso. O segredo estatístico não está em quantos você escolhe, mas em não saturar seu jogo com eles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* --- CARTÃO PRIMOS --- */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 border border-amber-100">
              <Binary size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Primos</h3>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59
              </p>
            </div>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataPrimos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={<CustomTooltip prefix="Qtd Primos:" />}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={35}>
                  {dataPrimos.map((entry, index) => {
                    const isSafe = entry.name === "1" || entry.name === "2";
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={isSafe ? "#f59e0b" : "#cbd5e1"}
                        fillOpacity={isSafe ? 1 : 0.5}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 flex items-center gap-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50">
            <div className="text-amber-600 font-black text-xl">66%</div>
            <p className="text-[11px] text-amber-800 leading-tight">
              dos sorteios históricos apresentam apenas <b>1 ou 2 números primos</b>.
            </p>
          </div>
        </div>

        {/* --- CARTÃO FIBONACCI --- */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Fibonacci</h3>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                1, 2, 3, 5, 8, 13, 21, 34, 55
              </p>
            </div>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataFib} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={<CustomTooltip prefix="Qtd Fibonacci:" />}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={35}>
                  {dataFib.map((entry, index) => {
                    const isSafe = entry.name === "0" || entry.name === "1";
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={isSafe ? "#10b981" : "#cbd5e1"}
                        fillOpacity={isSafe ? 1 : 0.5}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 flex items-center gap-3 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
            <div className="text-emerald-600 font-black text-xl">82%</div>
            <p className="text-[11px] text-emerald-800 leading-tight">
              dos jogos vencedores contêm <b>no máximo 1</b> número da sequência de Fibonacci.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
/** * =================================================================================
 * [GRÁFICO 4] QUADRANTES + COORDENADAS (L/C) - VERSÃO AMPLIADA
 * =================================================================================
 */
const ChartQuadrantes = ({ dataAssinatura }) => {
  const renderMiniVolante = () => {
    const getQuad = (n) => {
      if (n % 10 === 0) return n <= 30 ? 2 : 4;
      if (n <= 30) return (n % 10 >= 1 && n % 10 <= 5) ? 1 : 2;
      return (n % 10 >= 1 && n % 10 <= 5) ? 3 : 4;
    };

    const colors = {
      1: 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]',
      2: 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.4)]',
      3: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]',
      4: 'bg-slate-600'
    };

    return (
      // Aumentei a largura máxima e removi paddings desnecessários
      <div className="relative w-full max-w-2xl mx-auto p-4 sm:p-6 bg-slate-800/40 rounded-[32px] border border-slate-700/50 backdrop-blur-sm mt-4">

        {/* Labels de Colunas (Top) - Agora com larguras sincronizadas com o grid */}
        <div className="flex mb-2 ml-8 pr-1">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className="flex-1 text-[10px] font-black text-slate-500 text-center uppercase">
              C{i + 1}
            </span>
          ))}
        </div>

        <div className="flex">
          {/* Labels de Linhas (Left) */}
          <div className="flex flex-col justify-between py-2 pr-4">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className="text-[10px] font-black text-slate-500 flex items-center h-full">
                L{i + 1}
              </span>
            ))}
          </div>

          {/* Grid do Volante - w-full e gap maior para preencher o espaço */}
          <div className="grid grid-cols-10 gap-2 sm:gap-3 flex-1">
            {Array.from({ length: 60 }, (_, i) => i + 1).map(num => (
              <div
                key={num}
                className={`
                  aspect-square rounded-xl flex items-center justify-center 
                  text-xs sm:text-sm font-bold text-white transition-all 
                  hover:scale-110 hover:z-20 cursor-default
                  ${colors[getQuad(num)]}
                `}
              >
                {num.toString().padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 sm:p-12 rounded-[40px] shadow-sm border border-slate-100 mb-16">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">

        {/* Lado Esquerdo: Quadrantes (Ajustado para ocupar menos largura no desktop) */}
        <div className="lg:w-[35%] flex flex-col justify-center">
          <h3 className="text-3xl font-black text-slate-800 mb-4 uppercase tracking-tighter leading-none">
            Distribuição de <br /><span className="text-indigo-600">Quadrantes</span>
          </h3>

          <p className="text-slate-600 mb-6 leading-relaxed text-sm">
            A sorte na Mega-Sena costuma seguir dois caminhos: <b>equilíbrio total (2-2-1-1)</b> ou <b>vácuo estratégico (3-2-1-0)</b>.
          </p>

          <div className="space-y-4 mb-8">
            {dataAssinatura.map((item, i) => (
              <div key={i} className="flex items-center justify-between group">
                <span className="text-[10px] font-bold text-slate-400 w-16 uppercase tracking-widest">{item.name}</span>
                <div className="flex-1 mx-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${item.percent}%` }} />
                </div>
                <span className="text-xs font-black text-indigo-600 w-10 text-right">{item.percent}%</span>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-[13px] text-slate-600 leading-relaxed">
              Esses modelos representam <b>65% dos sorteios</b>. Use o mapa ao lado para distribuir suas dezenas seguindo esses padrões.
            </p>
          </div>
        </div>

        {/* Lado Direito: O Volante (Agora ocupando bem o espaço) */}
        <div className="lg:flex-1 bg-slate-900 rounded-[40px] p-6 sm:p-10 text-white flex flex-col items-center justify-center relative overflow-hidden min-h-[500px]">
          {/* Efeito de Glow de fundo */}
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-500/10 blur-[120px] rounded-full"></div>

          <div className="relative z-10 w-full">
            <div className="text-center mb-8">
              <h4 className="text-sm font-bold uppercase tracking-[0.3em] text-indigo-400 mb-3">Mapa de Coordenadas</h4>
              <div className="flex justify-center gap-6 text-[10px] font-black uppercase text-slate-500">
                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div> Q1</span>
                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-pink-500 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.8)]"></div> Q2</span>
                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div> Q3</span>
                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-slate-500 rounded-full"></div> Q4</span>
              </div>
            </div>

            {renderMiniVolante()}
          </div>
        </div>
      </div>
    </div>
  );
};
/** * =================================================================================
 * [GRÁFICO 5] LINHAS E COLUNAS VAZIAS (NOVO)
 * =================================================================================
 */
const ChartLinhasColunas = ({ dataLines, dataCols }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 border-b border-slate-100 pb-16">

      {/* --- LINHAS VAZIAS --- */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
            <LayoutGrid size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Linhas Vazias</h3>
            <p className="text-sm text-slate-400">Quantas linhas ficaram sem nenhum número?</p>
          </div>
        </div>

        <div className="w-full h-64 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataLines} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${val} Vazias`}
              />
              <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip prefix="Linhas Vazias:" />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {dataLines.map((entry, index) => {
                  // O padrão ouro é 1 ou 2 linhas vazias
                  const isSafe = entry.name === "1" || entry.name === "2";
                  return <Cell key={`cell-${index}`} fill={isSafe ? COLORS.primary : "#cbd5e1"} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-indigo-800 mt-6 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
          <b>Insight:</b> É matematicamente difícil preencher todas as linhas. O comum é ter <b>1 ou 2 linhas vazias</b>, o que significa que você naturalmente irá agrupar dois ou mais números na mesma "casa" (ex: dois números na casa dos 20).
        </p>
      </div>

      {/* --- COLUNAS VAZIAS --- */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-pink-50 rounded-2xl text-pink-600">
            <Grid3X3 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Colunas Vazias</h3>
            <p className="text-sm text-slate-400">Das 10 colunas, quantas não foram usadas?</p>
          </div>
        </div>

        <div className="w-full h-64 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataCols} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${val} Vazias`}
              />
              <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip prefix="Colunas Vazias:" />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {dataCols.map((entry, index) => {
                  // O padrão ouro é 4 ou 5 colunas vazias
                  const isSafe = entry.name === "4" || entry.name === "5";
                  return <Cell key={`cell-${index}`} fill={isSafe ? COLORS.secondary : "#cbd5e1"} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-pink-800 mt-6 bg-pink-50 p-3 rounded-lg border border-pink-100">
          <b>Insight:</b> Com apenas 6 números, você sempre terá colunas vazias. O ideal é ter <b>4 ou 5 vazias</b>. Isso indica que repetir o mesmo final (ex: 14 e 44, ambos na coluna 4) é um comportamento padrão e saudável para o seu jogo.
        </p>
      </div>

    </div>
  );
};

/** * =================================================================================
 * [GRÁFICO 6] TERMÔMETRO - REVISADO COM INSIGHTS DE MODERAÇÃO
 * =================================================================================
 */
const ChartTermometro = ({ data }) => {
  // Top 5 para exibição
  const topQuentes = [...data].sort((a, b) => b.freqLast20 - a.freqLast20).slice(0, 5);
  const topFrias = [...data].sort((a, b) => b.lag - a.lag).slice(0, 5);

  const maisAtrasada = topFrias[0]?.lag || 0;

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 mb-10 overflow-hidden">

      {/* HEADER COMPACTO */}
      <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Thermometer className="text-slate-400" size={20} />
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Destaques (Top 5)</h3>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">

        {/* --- LADO ESQUERDO: QUENTES --- */}
        <div className="p-5 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="text-rose-500 fill-rose-500" size={16} />
            <span className="text-sm font-bold text-rose-700">Mais Frequentes (Últimos 20 jogos)</span>
          </div>

          <div className="grid grid-cols-5 gap-2 mb-4">
            {topQuentes.map((stat) => (
              <div key={stat.num} className="flex flex-col items-center p-2 rounded-xl bg-rose-50 border border-rose-100 transition-transform hover:scale-105">
                <span className="text-lg font-black text-slate-700">{String(stat.num).padStart(2, '0')}</span>
                <span className="text-[10px] font-bold text-rose-600 bg-white px-2 py-0.5 rounded-full shadow-sm mt-1">
                  {stat.freqLast20}x
                </span>
              </div>
            ))}
          </div>

          {/* INSIGHT QUENTE REVISADO */}
          <div className="mt-auto bg-rose-50/50 p-3 rounded-lg border border-rose-100/50">
            <p className="text-[11px] text-rose-800 leading-snug">
              <b>Frequência de Curto Prazo:</b> Dezenas costumam sair em ciclos. Aproveite a "onda" do momento com moderação: o ideal é incluir <b>no máximo um</b> desses números para não saturar seu jogo.
            </p>
          </div>
        </div>

        {/* --- LADO DIREITO: FRIAS --- */}
        <div className="p-5 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <Snowflake className="text-cyan-500 fill-cyan-500" size={16} />
            <span className="text-sm font-bold text-cyan-700">Mais Atrasadas</span>
          </div>

          <div className="grid grid-cols-5 gap-2 mb-4">
            {topFrias.map((stat) => (
              <div key={stat.num} className="flex flex-col items-center p-2 rounded-xl bg-cyan-50 border border-cyan-100 transition-transform hover:scale-105">
                <span className="text-lg font-black text-slate-700">{String(stat.num).padStart(2, '0')}</span>
                <span className="text-[10px] font-bold text-cyan-600 bg-white px-2 py-0.5 rounded-full shadow-sm mt-1">
                  {stat.lag}j
                </span>
              </div>
            ))}
          </div>

          {/* INSIGHT FRIO REVISADO */}
          <div className="mt-auto bg-cyan-50/50 p-3 rounded-lg border border-cyan-100/50">
            <p className="text-[11px] text-cyan-800 leading-snug">
              <b>O Peso do Atraso:</b> A dezena mais tímida está há {maisAtrasada} jogos sem aparecer. Evite "cercar" muitos números atrasados; estatisticamente, ter <b>apenas um</b> deles ajuda a equilibrar o volante.
            </p>
          </div>
        </div>

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
            title="A Lei da Simetria"
            subtitle="Resultados puramente pares ou ímpares são anomalias. A aleatoriedade real tende ao equilíbrio."
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
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}P / ${6 - val}Í`}
              />
              <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip prefix="Configuração:" />} />
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

const SimulatorIntro = () => (
  /* Removi o max-w-4xl e usei w-full para seguir o container pai */
  <div className="w-full mb-10">
    <h2 className="text-2xl font-black text-slate-800 mb-4 tracking-tighter uppercase">
      Sua Estratégia, <span className="text-indigo-600">Validada por Dados</span>
    </h2>

    {/* Usei um grid simples aqui para que em telas grandes o texto e o aviso fiquem lado a lado, 
        evitando que o parágrafo fique com linhas longas demais para ler */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2">
        <p className="text-slate-600 leading-relaxed text-base">
          Agora que você já conferiu as análises, que tal avaliar a <strong>qualidade estatística</strong> da aposta que você pretende fazer?
          Nosso algoritmo cruza suas dezenas com os padrões de soma, paridade e distribuição que mais se repetiram na história da Mega-Sena.
        </p>
      </div>

      <div className="flex gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl shadow-sm">
        <div className="text-amber-600 shrink-0">
          <AlertCircle size={20} />
        </div>
        <p className="text-[12px] text-amber-900/80 leading-tight">
          <strong>Atenção:</strong> Ferramenta analítica baseada em tendências. Padrões ajudam a entender o comportamento histórico, mas <strong>não garantem prêmios</strong>.
        </p>
      </div>
    </div>
  </div>
);

/** * =================================================================================
 * [MAIN] DASHBOARD PRINCIPAL
 * =================================================================================
 */
export default function Dashboard() {
  const [filterVirada, setFilterVirada] = useState(false);

  const filteredData = useMemo(() => {
    // Garante que rawData existe antes de filtrar
    if (!rawData) return [];
    return rawData.filter(game => filterVirada ? String(game.tipo).toUpperCase() === 'VIRADA' : true);
  }, [filterVirada]);

  // --- ENGINE DE CÁLCULOS (CORRIGIDA) ---
  const stats = useMemo(() => {
    // Verificação de segurança
    if (!filteredData || filteredData.length === 0) {
      return { soma: [], primos: [], fib: [], assinatura: [], pares: [], lines: [], cols: [], termometro: [], probPares: 0, total: 0 };
    }

    const total = filteredData.length;

    // Acumuladores básicos
    const distSoma = {};
    const distPrimos = {};
    const distFib = {};
    const distAssinatura = {};
    const distLines = {};
    const distCols = {};
    const distPares = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    // --- 1. Loop Principal (Estatísticas Gerais) ---
    filteredData.forEach(g => {
      // Soma
      const bSoma = Math.floor(g.analises.soma / 10) * 10;
      distSoma[bSoma] = (distSoma[bSoma] || 0) + 1;
      // Primos/Fib/Assinatura
      distPrimos[g.analises.primos] = (distPrimos[g.analises.primos] || 0) + 1;
      distFib[g.analises.fibonacci] = (distFib[g.analises.fibonacci] || 0) + 1;
      distAssinatura[g.analises.quadrantes.assinatura] = (distAssinatura[g.analises.quadrantes.assinatura] || 0) + 1;
      // Pares
      const p = g.analises.pares;
      if (distPares[p] !== undefined) distPares[p]++;
      // Linhas/Colunas
      distLines[g.analises.linhas_vazias] = (distLines[g.analises.linhas_vazias] || 0) + 1;
      distCols[g.analises.colunas_vazias] = (distCols[g.analises.colunas_vazias] || 0) + 1;
    });

    // --- 2. Lógica de QUENTES e FRIAS (CORRIGIDA) ---
    const numbersStats = Array.from({ length: 60 }, (_, i) => {
      const num = i + 1;
      return { num, freqLast20: 0, lag: 0 };
    });

    // A. Frequência (Últimos 20 Jogos)
    const last20Games = filteredData.slice(0, 20);
    last20Games.forEach(g => {
      g.dezenas.forEach(d => {
        // Conversão forçada para garantir que "01" conte como 1
        if (Number(d) >= 1 && Number(d) <= 60) {
          numbersStats[Number(d) - 1].freqLast20++;
        }
      });
    });

    // B. Cálculo do Atraso (Lag) - CORREÇÃO DE TIPO
    numbersStats.forEach(stat => {
      // Encontra o índice do jogo mais recente que contém o número
      const lastIndex = filteredData.findIndex(g => {
        // Converte as dezenas do jogo para números antes de verificar
        const numerosDoJogo = g.dezenas.map(d => Number(d));
        return numerosDoJogo.includes(stat.num);
      });

      // Se lastIndex é 0, saiu no último jogo (Atraso 0). 
      // Se lastIndex é -1 (nunca saiu na lista carregada), definimos como o total.
      stat.lag = lastIndex === -1 ? total : lastIndex;
    });

    const format = (obj) => Object.entries(obj).map(([name, value]) => ({
      name, value, percent: ((value / total) * 100).toFixed(1)
    })).sort((a, b) => Number(a.name) - Number(b.name));

    const totalSeguro = (distPares[2] || 0) + (distPares[3] || 0) + (distPares[4] || 0);
    const probPares = ((totalSeguro / total) * 100).toFixed(1);

    return {
      soma: format(distSoma),
      primos: format(distPrimos),
      fib: format(distFib),
      assinatura: format(distAssinatura).sort((a, b) => b.value - a.value).slice(0, 5),
      pares: format(distPares),
      lines: format(distLines),
      cols: format(distCols),
      termometro: numbersStats, // <--- Dados Corrigidos
      probPares,
      total
    };
  }, [filteredData]);

  if (!rawData || rawData.length === 0) {
    return <div className="p-10 text-center text-red-500">Erro: Arquivo de dados vazio ou não encontrado.</div>;
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF] text-slate-900 pb-20 font-sans">

      {/* HEADER */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl rotate-3 shadow-lg shadow-indigo-200">
              <Activity className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase">Reberetta <span className="text-indigo-600">Analytics</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Mega Sena Data Insights</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* <button
              onClick={() => setFilterVirada(!filterVirada)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all border-2 ${filterVirada ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 text-slate-500 hover:border-indigo-200'
                }`}
            >
              {filterVirada ? '✨ MODO VIRADA ATIVO' : 'MOSTRAR SÓ JOGOS DA VIRADA'}
            </button> */}
            {/* <div className="h-8 w-[1px] bg-slate-100 mx-2" />
            <span className="text-xs font-medium text-slate-400">Analysis by <b className="text-slate-600">Regina Beretta</b></span>*/}

          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* INTRODUÇÃO DISCRETA E COMPACTA */}
        <div className="bg-indigo-900 rounded-[32px] p-6 lg:p-8 mb-8 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden">
          {/* Ícone de Fundo mais sutil */}
          <div className="absolute bottom-0 right-0 opacity-[0.05] transform translate-x-1/4 translate-y-1/4 pointer-events-none">
            <Binary size={250} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
            {/* Título e Ícone lateralizados */}
            <div className="flex items-center gap-4 shrink-0 border-b md:border-b-0 md:border-r border-indigo-500/30 pb-4 md:pb-0 md:pr-6">
              <div className="p-2 bg-indigo-500/20 rounded-lg backdrop-blur-md border border-indigo-400/30">
                <Sparkles size={20} className="text-amber-300" />
              </div>
              <h2 className="text-xl lg:text-2xl font-black tracking-tighter leading-tight max-w-[200px]">
                Análise de <br /><span className="text-indigo-300">Tendências</span>
              </h2>
            </div>

            {/* Texto consolidado */}
            <div className="flex-1 space-y-3">
              <p className="text-sm lg:text-base text-indigo-100 leading-snug">
                Embora cada número tenha a mesma chance, os <b className="text-white">conjuntos de seis dezenas</b> revelam padrões claros ao longo do tempo.
                Cruzamos dados de <b className="text-amber-300">{stats.total} concursos</b> para identificar comportamentos recorrentes e combinações raras.
              </p>
              <p className="text-xs uppercase tracking-widest font-bold text-indigo-400 flex items-center gap-2">
                <span className="w-8 h-[1px] bg-indigo-500/50"></span>
                Dados não prometem prêmios, oferecem contexto.
              </p>
            </div>
          </div>
        </div>


        {/* 1. SOMA & SIGMA */}
        <ChartSoma data={stats.soma} />

        {/* 2. PAR / ÍMPAR */}
        <ChartParImpar data={stats.pares} probSegura={stats.probPares} />

        {/* 3. PRIMOS E FIBONACCI */}
        <ChartPrimosFib dataPrimos={stats.primos} dataFib={stats.fib} />



        {/* 4. QUADRANTES */}
        <ChartQuadrantes dataAssinatura={stats.assinatura} />

        {/* 4. LINHAS E COLUNAS  */}
        <ChartLinhasColunas dataLines={stats.lines} dataCols={stats.cols} />

        {/* 5. TERMÔMETRO */}
        <ChartTermometro data={stats.termometro} />

        {/* 7. CHECKLIST FINAL  */}
        <ChecklistValidator />

        <SimulatorIntro />

        {/* Passamos o array termometro calculado no useMemo para o simulador usar */}
        <BetSimulator termometroData={stats.termometro} />


      </main>

      <footer className="max-w-7xl mx-auto px-6 border-t border-slate-100 pt-10 text-center">
        <p className="text-sm text-slate-400">
          Dados atualizados até Concurso {filteredData[0]?.concurso} • Análise e Dashboard por
          <a href="https://reberetta.com.br" className="text-indigo-600 font-bold ml-1 hover:underline">Regina Beretta</a>
        </p>
      </footer>
    </div>
  );
}