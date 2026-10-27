export type CampaignYears = 1 | 2 | 3;
export type ProjectAction = 'none' | 'pilot' | 'launch' | 'expand' | 'pause' | 'resume' | 'close';
export type CarAction = 'keep' | 'compact' | 'family' | 'sell';
export type Car = { model: 'compact' | 'family'; value: number; bought: number };
export type Business = { level: 1 | 2; paused: boolean; opened: number };
export type TermDeposit = { principal: number; value: number; due: number; rate: number };

export type GoalId = 'capital' | 'career' | 'freedom';

export type DifficultyId = 'first' | 'balance' | 'challenge' | 'hardcore';
export type DevelopmentId = 'none' | 'self' | 'course' | 'internship';

export type RoomItemId = 'lamp' | 'desk' | 'chair' | 'mattress' | 'shelf' | 'plant';

export type Option = {
  id: string;
  title: string;
  description: string;
  cost?: number;
  income?: number;
  hours?: number;
  education?: number;
  energy?: number;
  skills?: number;
  safety?: number;
  hiddenLoss?: number;
  uncertainOutcome?: boolean;
  loan?: number;
  explanation: string;
  delayed?: { after: number; cash?: number; skills?: number; title: string };
};

export type Scenario = {
  title: string;
  topic: string;
  lead: string;
  document: { title: string; text: string };
  options: Option[];
  discussion: string;
};

export type Loan = {
  id: string;
  name: string;
  balance: number;
  rate: number;
  remaining: number;
  payment: number;
  monthlyFee: number;
};

export type Pending = {
  due: number;
  cash?: number;
  skills?: number;
  title: string;
  development?: 'course';
};

export type GameState = {
  years?: CampaignYears;
  car?: Car;
  business?: Business;
  pilotDone?: boolean;
  deposits?: TermDeposit[];
  cash: number;
  savings: number;
  fund: number;
  education: number;
  energy: number;
  skills: number;
  safety: number;
  loans: Loan[];
  pending: Pending[];
  deficits: number;
  roomItems?: RoomItemId[];
  developmentProgress?: 0 | 1;
  hardcoreFailures?: string[];
};

export type Plan = {
  housing: string;
  job: string;
  study: number;
  leisure: number;
  save: number;
  withdraw: number;
  invest: number;
  sell: number;
  borrow: number;
  offer: string;
  choice: string;
  scenario?: string;
  extras?: { scenario: string; choice: string }[];
  roomVersion?: 1;
  roomBuy?: RoomItemId[];
  development?: DevelopmentId;
  project?: ProjectAction;
  carAction?: CarAction;
  termDeposit?: number;
};

export type Ledger = { label: string; amount: number; kind: 'income' | 'expense' | 'transfer' };

export type Report = {
  month: number;
  before: GameState;
  after: GameState;
  plan: Plan;
  ledger: Ledger[];
  explanation: string;
  warnings: string[];
  hours: number;
  net: number;
  interest: number;
  market: number;
  score: number;
  assets?: {
    businessNet: number;
    businessHours: number;
    carCost: number;
    depreciation: number;
    depositInterest: number;
  };
  extras?: { scenario: string; choice: string; explanation: string }[];
  room?: { purchased: RoomItemId[]; gifted: RoomItemId[]; education: number; energy: number };
  development?: {
    action: DevelopmentId;
    skillsGained: number;
    selfProgress: number;
    completedCourses: number;
  };
};

export type Solo = {
  name: string;
  goal: GoalId;
  difficulty: DifficultyId;
  month: number;
  state: GameState;
  reports: Report[];
  plans: Plan[];
};
