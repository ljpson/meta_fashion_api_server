// random number generator for email verifying
function generateRandomNumber(): string {
  const min: number = 0;
  const max: number = 10;
  let numString: string = '';
  for (let i = 0; i < 5; i++) {
    let num: number = Math.floor(Math.random() * (max - min)) + min;
    numString = numString.concat(num.toString());
  }
  return numString;
}

export { generateRandomNumber };