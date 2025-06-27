"use client";

export default function PiedFacture() {
  return (
    <div
      className="print-footer"
      style={{
        textAlign: "center",
        fontFamily: '"Arial", sans-serif',
        border: "2px solid #228B8B",
        padding: "10px",
        borderRadius: "12px",
        backgroundColor: "#228B8B", // Turquoise
        color: "white", // Texte blanc
      }}
    >
      <div
        style={{
          fontSize: "16px",
          fontWeight: "bold",
          marginBottom: "12px",
          color: "white", // Titre en blanc aussi
        }}
      >
        STE OUDAOUDOX SARL - Avenue Jaber Ben Hayane Bloc A N°01 Hay El Houda -
        Agadir
      </div>

      <div
        style={{
          fontSize: "14px",
          marginBottom: "15px",
          lineHeight: "1.4",
          color: "white", // Texte blanc
        }}
      >
        Gsm : 06 61 58 53 08 - 06 63 63 72 44 • E-mail : inoxoudaoud@gmail.com
      </div>

      <hr
        style={{
          border: "none",
          height: "1px",
          background:
            "linear-gradient(to right, transparent, white, transparent)", // Ligne blanche
          margin: "15px 0",
        }}
      />

      <div
        style={{
          fontSize: "12px",
          color: "rgba(255, 255, 255, 0.9)", // Blanc légèrement transparent
          letterSpacing: "0.5px",
        }}
      >
        RC : 53805 - TP : 67504461 - IF : 53290482 - ICE : 003172063000061
      </div>
    </div>
  );
}

export function PiedFactureStyle2() {
  return (
    <div
      className="print-footer"
      style={{
        textAlign: "center",
        fontFamily: '"Arial", sans-serif',
        border: "2px solid #228B8B",
        padding: "5px",
        borderRadius: "12px",
        backgroundColor: "#f8fffe",
        color: "#2c5555",
      }}
    >
      <div
        style={{
          fontSize: "16px",
          fontWeight: "bold",
          marginBottom: "5px",
          color: "#228B8B",
        }}
      >
        STE OUDAOUDOX SARL - Avenue Jaber Ben Hayane Bloc A N°01 Hay El Houda -
        Agadir
      </div>

      <div
        style={{
          fontSize: "14px",
          marginBottom: "5px",
          lineHeight: "1.4",
        }}
      >
        Gsm : 06 61 58 53 08 - 06 63 63 72 44 • E-mail : inoxoudaoud@gmail.com
      </div>

      <hr
        style={{
          border: "none",
          height: "1px",
          background:
            "linear-gradient(to right, transparent, #228B8B, transparent)",
          margin: "5px 0",
        }}
      />

      <div
        style={{
          fontSize: "12px",
          color: "#666",
          letterSpacing: "0.5px",
        }}
      >
        RC : 53805 - TP : 67504461 - IF : 53290482 - ICE : 003172063000061
      </div>
    </div>
  );
}
