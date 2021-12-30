export function debounce<F extends (...args: any) => any>( func: F, waitFor: number) {
  
  let timeout = 0

  const debounced = (...args: any) => {
  console.log("debounces");
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), waitFor)
  }

  return debounced as (...args: Parameters<F>) => ReturnType<F>
}
