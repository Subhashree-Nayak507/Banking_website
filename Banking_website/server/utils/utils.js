
export const generateAccountNumber = () => {
    const prefix = "1001"; 
    const randomPart = Math.floor(10000000 + Math.random() * 90000000); 
    return prefix + randomPart;
};

export function generateReferenceNumber() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN${timestamp}${random}`;
}