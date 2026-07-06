export default function BoschHeader() {
  return (
    <header className="bosch-header">
      <div className="bosch-supergraphic" aria-hidden="true" />
      <div className="bosch-header-bar">
        <div className="bosch-logo" aria-label="Bosch">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="24" cy="24" r="24" fill="#E00016" />
            <text
              x="24" y="29"
              textAnchor="middle"
              fill="white"
              fontFamily="boschsans, sans-serif"
              fontWeight="700"
              fontSize="13"
              letterSpacing="0.5"
            >
              Bosch
            </text>
          </svg>
        </div>
        <span className="bosch-app-title">AI Assistant</span>
      </div>
    </header>
  );
}
