/**
 * Mapeamento de Ícones - Sistema Padronizado
 * 
 * Centraliza todos os ícones do sistema usando Material Icons
 * para garantir consistência visual.
 */

import {
  // Navegação e Home
  Home,
  Dashboard,
  Menu as MenuIcon,

  // Cadastros
  Description,
  Edit,
  Add,
  Delete,
  Save,
  Clear,
  Search,

  // Pessoas
  People,
  Person,
  PersonAdd,
  Group,
  Business,

  // Produtos e Estoque
  Inventory,
  Inventory2,
  Category,
  LocalOffer,

  // Vendas e Compras
  ShoppingCart,
  ShoppingBag,
  Receipt,
  ReceiptLong,
  Store,
  Storefront,

  // Financeiro
  AccountBalance,
  AttachMoney,
  Payment,
  CreditCard,
  MonetizationOn,
  TrendingUp,
  TrendingDown,

  // Documentos
  Print,
  PictureAsPdf,
  Email,
  Share,
  Download,
  Upload,

  // Comunicação
  WhatsApp,
  Phone,
  Message,
  Notifications,

  // Autorizações e Segurança
  Security,
  Lock,
  LockOpen,
  Gavel,
  VerifiedUser,
  AdminPanelSettings,

  // Configurações
  Settings,
  Tune,
  Build,

  // Ações
  Check,
  CheckCircle,
  Cancel,
  Close,
  Refresh,
  Sync,

  // Status
  Info,
  Warning,
  Error,
  ErrorOutline,

  // Navegação
  ArrowBack,
  ArrowForward,
  ExpandMore,
  ExpandLess,
  ChevronLeft,
  ChevronRight,

  // Visualização
  Visibility,
  VisibilityOff,
  List,
  ViewModule,
  ViewList,

  // Tempo
  Schedule,
  Today,
  CalendarToday,
  AccessTime,

  // Transporte
  LocalShipping,
  DeliveryDining,

  // Outros
  Star,
  StarBorder,
  Favorite,
  FavoriteBorder,
  Assignment,
  Assessment,
  BarChart,
  PieChart,
  Computer,
  Smartphone,
  Tablet,
  QrCode,
  QrCode2
} from '@mui/icons-material';

/**
 * Mapeamento de ícones por categoria/funcionalidade
 */
export const iconMapping = {
  // NAVEGAÇÃO PRINCIPAL
  inicial: Home,
  home: Home,
  dashboard: Dashboard,
  menu: MenuIcon,

  // CADASTROS
  cadastro: Description,
  editar: Edit,
  adicionar: Add,
  excluir: Delete,
  salvar: Save,
  limpar: Clear,
  buscar: Search,

  // CLIENTES E FORNECEDORES
  cliente: People,
  clientes: People,
  pessoa: Person,
  adicionarPessoa: PersonAdd,
  grupo: Group,
  fornecedor: LocalShipping,
  fornecedores: LocalShipping,
  empresa: Business,

  // PRODUTOS
  produto: Inventory,
  produtos: Inventory2,
  categoria: Category,
  estoque: Inventory,
  preco: LocalOffer,
  codigoBarras: QrCode2,

  // VENDAS
  venda: ShoppingCart,
  vendas: ShoppingCart,
  carrinho: ShoppingCart,
  loja: Store,
  vitrine: Storefront,
  pedido: Receipt,
  pedidos: ReceiptLong,

  // COMPRAS
  compra: ShoppingBag,
  compras: ShoppingBag,

  // FINANCEIRO
  financeiro: AccountBalance,
  banco: AccountBalance,
  cheques: Payment,
  cheque: Payment,
  dinheiro: AttachMoney,
  pagamento: Payment,
  cartao: CreditCard,
  moeda: MonetizationOn,
  crescimento: TrendingUp,
  queda: TrendingDown,

  // DOCUMENTOS E IMPRESSÃO
  imprimir: Print,
  pdf: PictureAsPdf,
  email: Email,
  compartilhar: Share,
  baixar: Download,
  enviar: Upload,

  // COMUNICAÇÃO
  whatsapp: WhatsApp,
  telefone: Phone,
  mensagem: Message,
  notificacao: Notifications,
  notificacoes: Notifications,

  // AUTORIZAÇÕES
  autorizacao: Security,
  autorizacoes: Security,
  seguranca: Security,
  cadeado: Lock,
  desbloqueado: LockOpen,
  aprovacao: Gavel,
  aprovacoes: Gavel,
  verificado: VerifiedUser,
  admin: AdminPanelSettings,

  // CONFIGURAÇÕES
  configuracoes: Settings,
  configuracao: Settings,
  ajustes: Tune,
  ferramentas: Build,

  // AÇÕES
  confirmar: Check,
  confirmado: CheckCircle,
  cancelar: Cancel,
  fechar: Close,
  atualizar: Refresh,
  sincronizar: Sync,

  // STATUS
  informacao: Info,
  aviso: Warning,
  erro: Error,
  erroOutline: ErrorOutline,
  sucesso: CheckCircle,

  // NAVEGAÇÃO DETALHADA
  voltar: ArrowBack,
  avancar: ArrowForward,
  expandir: ExpandMore,
  recolher: ExpandLess,
  esquerda: ChevronLeft,
  direita: ChevronRight,

  // VISUALIZAÇÃO
  visualizar: Visibility,
  ocultar: VisibilityOff,
  lista: List,
  grade: ViewModule,
  listaDetalhada: ViewList,

  // TEMPO E DATA
  agenda: Schedule,
  hoje: Today,
  calendario: CalendarToday,
  horario: AccessTime,

  // TRANSPORTE
  entrega: LocalShipping,
  motoboy: DeliveryDining,

  // RELATÓRIOS
  relatorio: Assessment,
  grafico: BarChart,
  graficoLinha: Assessment,
  graficoPizza: PieChart,
  atribuicao: Assignment,

  // FAVORITOS
  estrela: Star,
  estrelaBorda: StarBorder,
  favorito: Favorite,
  favoritoBorda: FavoriteBorder,

  // DISPOSITIVOS
  computador: Computer,
  celular: Smartphone,
  tablet: Tablet,

  // OUTROS
  qrcode: QrCode,
  qrcodeScan: QrCode2
};

/**
 * Helper para obter ícone por nome
 * Retorna null se o ícone não existir
 */
export const getIcon = (name) => {
  return iconMapping[name] || null;
};

/**
 * Helper para verificar se um ícone existe
 */
export const hasIcon = (name) => {
  return name in iconMapping;
};

/**
 * Lista todos os nomes de ícones disponíveis
 */
export const getAvailableIcons = () => {
  return Object.keys(iconMapping);
};

/**
 * Ícones por categoria (para documentação/seleção)
 */
export const iconsByCategory = {
  navegacao: ['inicial', 'home', 'dashboard', 'menu', 'voltar', 'avancar'],
  cadastros: ['cadastro', 'editar', 'adicionar', 'excluir', 'salvar', 'limpar', 'buscar'],
  pessoas: ['cliente', 'clientes', 'pessoa', 'fornecedor', 'fornecedores', 'empresa'],
  produtos: ['produto', 'produtos', 'categoria', 'estoque', 'preco', 'codigoBarras'],
  vendas: ['venda', 'vendas', 'carrinho', 'loja', 'pedido', 'pedidos'],
  compras: ['compra', 'compras'],
  financeiro: ['financeiro', 'banco', 'dinheiro', 'pagamento', 'cartao', 'moeda'],
  documentos: ['imprimir', 'pdf', 'email', 'compartilhar', 'baixar', 'enviar'],
  comunicacao: ['whatsapp', 'telefone', 'mensagem', 'notificacao'],
  autorizacoes: ['autorizacao', 'seguranca', 'cadeado', 'aprovacao', 'verificado', 'admin'],
  configuracoes: ['configuracoes', 'ajustes', 'ferramentas'],
  acoes: ['confirmar', 'cancelar', 'fechar', 'atualizar', 'sincronizar'],
  status: ['informacao', 'aviso', 'erro', 'sucesso'],
  visualizacao: ['visualizar', 'ocultar', 'lista', 'grade'],
  tempo: ['agenda', 'hoje', 'calendario', 'horario'],
  outros: ['qrcode', 'estrela', 'favorito', 'computador', 'celular', 'tablet']
};

export default iconMapping;
