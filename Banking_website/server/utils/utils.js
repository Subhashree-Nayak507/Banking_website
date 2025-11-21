
export const generateAccountNumber = () => {
    const prefix = "1001"; 
    const randomPart = Math.floor(10000000 + Math.random() * 90000000); 
    return prefix + randomPart;
};