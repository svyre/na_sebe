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
