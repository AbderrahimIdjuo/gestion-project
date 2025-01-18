import React from 'react'

export const LoadingDots = ({ color = 'currentColor', size = 4 }) => {
  return (
    <span
      className="inline-flex items-center"
      role="status"
      aria-label="Loading"
    >
      {[...Array(3)].map((_, i) => (
        <span
          key={i}
          style={{
            backgroundColor: color,
            width: size,
            height: size,
            borderRadius: '50%',
            margin: `0 ${size / 2}px`,
            display: 'inline-block',
            animation: 'loadingDotsWave 1.4s infinite ease-in-out both',
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
      <style jsx>{`
  @keyframes loadingDotsWave {
    0%, 100% { 
      transform: translateY(0) scale(0.8);
    }
    50% { 
      transform: translateY(-100%) scale(1);
    }
  }
`}</style>
    </span>
  )
}

