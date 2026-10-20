export interface CardFields {
  holderName: string;
  cardNumber: string;
  cvv: string;
  expMonth: string;
  expYear: string;
}

export interface ThreeDsCustomer {
  amount: number;
  currency: "BRL";
  email: string;
  name: string;
  phone: string;
  paymentMethod: "credit";
}

export interface ThreeDsResult {
  success: boolean;
  error?: string;
  cavv?: string;
  eci?: string;
  xid?: string;
  referenceId?: string;
  version?: string;
}

export interface CaktoSdk {
  initAntifraud(): Promise<void>;
  completeAntifraudProfile(): Promise<void>;
  getAntifraudReference(): string;
  createToken(card: CardFields): Promise<{ cardToken: string }>;
  authenticate3DS(input: { card: CardFields; customer: ThreeDsCustomer }): Promise<ThreeDsResult>;
}

declare global {
  interface Window {
    Cakto?: { CaktoSDK: new (options: { client_id: string }) => CaktoSdk };
  }
}

let loading: Promise<CaktoSdk> | null = null;

export function loadCaktoSdk(scriptUrl: string, clientId: string): Promise<CaktoSdk> {
  loading ??= new Promise<CaktoSdk>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => {
      if (window.Cakto === undefined) return reject(new Error("Cakto SDK did not load"));
      const sdk = new window.Cakto.CaktoSDK({ client_id: clientId });
      void sdk.initAntifraud().catch(() => undefined);
      resolve(sdk);
    };
    script.onerror = () => reject(new Error("Cakto SDK did not load"));
    document.head.append(script);
  }).catch((error: unknown) => {
    loading = null;
    throw error;
  });

  return loading;
}
