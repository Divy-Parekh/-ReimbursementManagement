export default function Card({ children, className = '', hover = false, glow = false, ...props }) {
  return (
    <div
      className={`glass rounded-xl p-5 ${
        hover ? 'transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10' : ''
      } ${glow ? 'animate-[pulse-glow_3s_ease-in-out_infinite]' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
