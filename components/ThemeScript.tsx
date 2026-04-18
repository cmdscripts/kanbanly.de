const code = `(()=>{try{var t=localStorage.getItem('theme');var s=t||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.dataset.theme=s;document.documentElement.style.colorScheme=s;}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
