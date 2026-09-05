export type WalletTxn = {
  id: string;
  title: string;
  time: string;
  amount: string;
  credit: boolean;
};

// Newest first.
export const VENDOR_TRANSACTIONS: WalletTxn[] = [
  { id: "1", title: "Order #BN-2277 payout", time: "Today, 2:40pm", amount: "₦2,600", credit: true },
  { id: "2", title: "Order #BN-2270 payout", time: "Today, 11:05am", amount: "₦1,800", credit: true },
  { id: "3", title: "Withdrawal to GTBank ••4821", time: "Yesterday", amount: "₦5,000", credit: false },
  { id: "4", title: "Wallet top-up", time: "Mon, 3:12pm", amount: "₦10,000", credit: true },
  { id: "5", title: "Order #BN-2261 payout", time: "Mon, 1:18pm", amount: "₦3,400", credit: true },
  { id: "6", title: "Order #BN-2255 payout", time: "Sun, 6:02pm", amount: "₦2,150", credit: true },
  { id: "7", title: "Withdrawal to GTBank ••4821", time: "Sat", amount: "₦8,000", credit: false },
  { id: "8", title: "Order #BN-2248 payout", time: "Sat, 12:44pm", amount: "₦1,500", credit: true },
  { id: "9", title: "Order #BN-2240 payout", time: "Fri, 4:29pm", amount: "₦4,900", credit: true },
  { id: "10", title: "Wallet top-up", time: "Fri, 9:10am", amount: "₦15,000", credit: true },
  { id: "11", title: "Withdrawal to Access ••7712", time: "Thu", amount: "₦12,000", credit: false },
  { id: "12", title: "Order #BN-2231 payout", time: "Thu, 3:55pm", amount: "₦2,700", credit: true },
];
