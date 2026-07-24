export type RootStackParamList = {
  Tabs: undefined;
  Booking: { partnerId: string };
  Confirmation: {
    partnerName: string;
    vehicleName: string;
    pkgName: string;
    pkgPrice: string;
    slot: string;
    payLabel: string;
    receiptNo: string;
    washNext: number;
  };
  Notifications: undefined;
  Rating: undefined;
};

export type TabParamList = {
  Home: undefined;
  Rewards: undefined;
  Partner: undefined;
};
