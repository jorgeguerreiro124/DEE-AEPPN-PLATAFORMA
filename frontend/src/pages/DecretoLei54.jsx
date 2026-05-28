import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ScrollText, Users, Layers, Target, ListChecks, FileText,
  GraduationCap, Sparkles, ExternalLink, Info,
} from "lucide-react";

const MEDIDAS_UNIVERSAIS = [
  { t: "Diferenciação pedagógica", d: "Estratégias adaptadas aos diferentes ritmos e estilos de aprendizagem da turma." },
  { t: "Acomodações curriculares", d: "Ajustes nos processos de ensino e avaliação sem alteração das aprendizagens essenciais." },
  { t: "Enriquecimento curricular", d: "Atividades que aprofundam ou alargam as aprendizagens previstas." },
  { t: "Promoção do comportamento pró-social", d: "Ações para desenvolver competências socioemocionais e relacionais." },
  { t: "Intervenção com foco académico ou comportamental em pequenos grupos", d: "Apoio em grupos reduzidos, em contexto de sala de aula ou fora dela." },
];

const MEDIDAS_SELETIVAS = [
  { t: "Percursos curriculares diferenciados", d: "Adequações pontuais no currículo, mantendo as aprendizagens essenciais." },
  { t: "Adaptações curriculares não significativas", d: "Modificações no programa que não comprometem as aprendizagens estruturantes." },
  { t: "Apoio psicopedagógico", d: "Intervenção especializada em áreas cognitivas, emocionais ou de aprendizagem." },
  { t: "Antecipação e reforço das aprendizagens", d: "Atividades de preparação prévia ou consolidação posterior dos conteúdos." },
  { t: "Apoio tutorial", d: "Acompanhamento individual por um docente tutor, com plano definido." },
];

const MEDIDAS_ADICIONAIS = [
  { t: "Frequência do ano de escolaridade por disciplinas", d: "Permite ao aluno progredir disciplina a disciplina, respeitando o seu ritmo." },
  { t: "Adaptações curriculares significativas", d: "Alterações nas aprendizagens essenciais — implica RTP e PEI." },
  { t: "Plano Individual de Transição (PIT)", d: "Para alunos com 15+ anos, prepara a transição para a vida pós-escolar (3 anos antes do limite de escolaridade obrigatória)." },
  { t: "Desenvolvimento de metodologias e estratégias de ensino estruturado", d: "Modelos pedagógicos altamente estruturados, frequentemente para alunos no espectro do autismo." },
  { t: "Desenvolvimento de competências de autonomia pessoal e social", d: "Treino de competências para a vida diária, autodeterminação e participação social." },
];

const DOCUMENTOS = [
  {
    sigla: "RTP",
    nome: "Relatório Técnico-Pedagógico",
    quando: "Sempre que se mobilizem medidas seletivas ou adicionais.",
    icon: ScrollText,
  },
  {
    sigla: "PEI",
    nome: "Programa Educativo Individual",
    quando: "Quando se aplicam adaptações curriculares significativas (medidas adicionais).",
    icon: FileText,
  },
  {
    sigla: "PIT",
    nome: "Plano Individual de Transição",
    quando: "Para alunos com 15+ anos com adaptações curriculares significativas, preparando a transição pós-escolar.",
    icon: GraduationCap,
  },
];

function Pilar({ icon: Icon, badge, badgeColor, titulo, descricao, exemplos, testid }) {
  return (
    <Card className="p-6 h-full flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md" data-testid={testid}>
      <div className="flex items-start justify-between mb-4">
        <div className="size-11 rounded-md bg-secondary text-foreground grid place-items-center">
          <Icon className="size-5" strokeWidth={1.75} />
        </div>
        <Badge className={badgeColor}>{badge}</Badge>
      </div>
      <h3 className="font-display text-xl font-semibold tracking-tight">{titulo}</h3>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{descricao}</p>
      <Separator className="my-5" />
      <div className="overline mb-3">Exemplos de medidas</div>
      <Accordion type="single" collapsible className="w-full">
        {exemplos.map((m, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border-border">
            <AccordionTrigger className="text-sm hover:no-underline text-left">{m.t}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
              {m.d}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  );
}

export default function DecretoLei54() {
  return (
    <div className="space-y-8" data-testid="dl54-page">
      <div>
        <div className="overline">Enquadramento Legal</div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mt-2">
          Decreto-Lei n.º 54/2018
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed max-w-3xl">
          Estabelece o regime jurídico da <strong>educação inclusiva</strong>, garantindo a todos os alunos
          o direito a uma educação que respeite as suas potencialidades, expectativas e necessidades, num
          quadro de equidade.
        </p>
      </div>

      {/* Princípios fundamentais */}
      <Card className="p-6 bg-secondary/40 border-dashed">
        <div className="flex items-start gap-4">
          <div className="size-10 rounded-md bg-primary text-primary-foreground grid place-items-center shrink-0">
            <Info className="size-5" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">Princípios orientadores</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground leading-relaxed">
              <li><strong className="text-foreground">Educabilidade universal</strong> — todos os alunos têm capacidade de aprender e direito à educação.</li>
              <li><strong className="text-foreground">Equidade</strong> — todos têm acesso aos apoios necessários para concretizar o seu direito à educação.</li>
              <li><strong className="text-foreground">Inclusão</strong> — todos os alunos pertencem à comunidade educativa e participam plenamente.</li>
              <li><strong className="text-foreground">Personalização</strong> — o planeamento educativo é centrado no aluno.</li>
              <li><strong className="text-foreground">Flexibilidade</strong> — a gestão curricular adapta-se às características dos alunos.</li>
              <li><strong className="text-foreground">Autodeterminação</strong> — respeito pela autonomia e participação do aluno e da família.</li>
              <li><strong className="text-foreground">Envolvimento parental</strong> — direito e dever de participação dos pais ou encarregados de educação.</li>
              <li><strong className="text-foreground">Interferência mínima</strong> — apoios prestados no contexto natural, evitando exclusão.</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Três níveis de medidas */}
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
          Medidas de Suporte à Aprendizagem e à Inclusão
        </h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-3xl leading-relaxed">
          As medidas organizam-se em três níveis de intervenção, de aplicação <em>progressiva</em> consoante as necessidades do aluno.
          A mobilização das medidas seletivas e adicionais exige fundamentação em <strong>Relatório Técnico-Pedagógico (RTP)</strong>.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <Pilar
            testid="pilar-universais"
            icon={Users}
            badge="Universais"
            badgeColor="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-transparent hover:bg-blue-100"
            titulo="Para todos os alunos"
            descricao="Respostas educativas que a escola tem disponíveis para todos, visando promover a participação e a melhoria das aprendizagens."
            exemplos={MEDIDAS_UNIVERSAIS}
          />
          <Pilar
            testid="pilar-seletivas"
            icon={Target}
            badge="Seletivas"
            badgeColor="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-transparent hover:bg-amber-100"
            titulo="Quando as universais não bastam"
            descricao="Mobilizadas quando as medidas universais se mostram insuficientes para colmatar as necessidades do aluno. Requerem RTP."
            exemplos={MEDIDAS_SELETIVAS}
          />
          <Pilar
            testid="pilar-adicionais"
            icon={Sparkles}
            badge="Adicionais"
            badgeColor="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-transparent hover:bg-rose-100"
            titulo="Necessidades acentuadas e persistentes"
            descricao="Respostas a dificuldades acentuadas e persistentes nos domínios da comunicação, interação, cognição ou aprendizagem. Requerem RTP e PEI."
            exemplos={MEDIDAS_ADICIONAIS}
          />
        </div>
      </div>

      {/* Documentos */}
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Documentos Estruturantes</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-3xl leading-relaxed">
          Os documentos formais que sustentam e operacionalizam a aplicação das medidas previstas no DL 54/2018.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {DOCUMENTOS.map((doc) => (
            <Card key={doc.sigla} className="p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md" data-testid={`doc-${doc.sigla}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-md bg-primary/10 text-primary grid place-items-center">
                  <doc.icon className="size-5" strokeWidth={1.75} />
                </div>
                <div>
                  <Badge variant="secondary" className="font-mono">{doc.sigla}</Badge>
                </div>
              </div>
              <h3 className="font-display text-base font-semibold tracking-tight">{doc.nome}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{doc.quando}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* EMAEI */}
      <Card className="p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1">
            <div className="size-12 rounded-md bg-primary text-primary-foreground grid place-items-center mb-4">
              <Layers className="size-6" strokeWidth={1.75} />
            </div>
            <Badge variant="secondary" className="font-mono mb-2">EMAEI</Badge>
            <h2 className="font-display text-xl font-semibold tracking-tight">Equipa Multidisciplinar de Apoio à Educação Inclusiva</h2>
          </div>
          <div className="lg:col-span-2 space-y-4 text-sm leading-relaxed">
            <p className="text-muted-foreground">
              Equipa permanente em cada agrupamento, responsável por <strong className="text-foreground">analisar a situação dos alunos</strong>,
              propor a mobilização das medidas de suporte e elaborar o <strong className="text-foreground">RTP</strong> e, quando aplicável, o <strong className="text-foreground">PEI</strong>.
            </p>
            <div>
              <div className="overline mb-2">Composição (artigo 12.º)</div>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>• Elementos permanentes: subdiretor, docente de educação especial, três docentes do conselho pedagógico, psicólogo</li>
                <li>• Elementos variáveis: docente titular / diretor de turma, outros docentes do aluno, técnicos do CRI ou parceiros</li>
                <li>• Pais ou encarregados de educação e o próprio aluno (sempre que possível)</li>
              </ul>
            </div>
            <div>
              <div className="overline mb-2">Competências principais</div>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>• Sensibilizar a comunidade educativa para a educação inclusiva</li>
                <li>• Identificar medidas de suporte a mobilizar</li>
                <li>• Acompanhar e monitorizar a aplicação das medidas</li>
                <li>• Prestar aconselhamento aos docentes na implementação de práticas inclusivas</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Outras estruturas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <ListChecks className="size-5 text-primary" strokeWidth={1.75} />
            <h3 className="font-display text-base font-semibold tracking-tight">Centro de Apoio à Aprendizagem (CAA)</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Estrutura agregadora dos recursos humanos e materiais para apoiar a inclusão. Trabalha com os docentes na conceção
            de estratégias para todos os alunos, com particular atenção àqueles com medidas seletivas e adicionais.
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="size-5 text-primary" strokeWidth={1.75} />
            <h3 className="font-display text-base font-semibold tracking-tight">Adaptações ao processo de avaliação</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Incluem, entre outras: prova adaptada, tempo suplementar, leitura de enunciados, utilização de materiais específicos
            e produtos de apoio. Aplicáveis em qualquer das três áreas de medidas, quando justificado.
          </p>
        </Card>
      </div>

      {/* Footer / fonte */}
      <div className="rounded-lg border border-border bg-secondary/40 p-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="text-xs sm:text-sm text-muted-foreground">
          Fonte oficial: <strong className="text-foreground">Decreto-Lei n.º 54/2018, de 6 de julho</strong>, alterado pela Lei n.º 116/2019, de 13 de setembro.
        </div>
        <a
          href="https://dre.pt/dre/detalhe/decreto-lei/54-2018-115652961"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline shrink-0"
          data-testid="dl54-dre-link"
        >
          Consultar no Diário da República
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  );
}
