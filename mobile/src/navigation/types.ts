export type RootStackParamList = {
  Tabs: undefined;
  Booking: { tenantId: number };
  Confirmation: {
    partnerName: string;
    vehicleName: string;
    serviceName: string;
    amount: string;
    scheduledLabel: string;
    payLabel: string;
    receiptNo: string;
    washCount: number;
    threshold: number;
    voucherEarned: boolean;
  };
  Notifications: undefined;
  Rating: undefined;
  AddVehicle: undefined;
};

export type TabParamList = {
  Home: undefined;
  Rewards: undefined;
  Partner: undefined;
};
