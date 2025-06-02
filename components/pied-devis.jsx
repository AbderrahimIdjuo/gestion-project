"use client";

export default function PiedDevis(){
  return (
    <div
      className="print-footer "
      style={{
        backgroundColor: "#228B8B",
        padding: "10px",
        textAlign: "center",
        color: "white",
        fontFamily: '"Times New Roman", serif',
      }}
    >
      <div>
      <div style={{ fontSize: "14px", fontWeight: "medium" }}>
        STE OUDAOUDOX SARL - Avenue Jaber Ben Hayane Bloc A N°01 Hay El Houda -
        Agadir
      </div>
      <hr
        style={{
          width: "40%",
          margin: "5px auto",
          border: "0.5px solid white",
        }}
      />
      <div style={{ marginTop: "5px", fontSize: "13px" }}>
        Gsm : 06 61 58 53 08 - 06 63 63 72 44 - E-mail : inoxoudaoud@gmail.com
      </div>
      </div>
    </div>
  );
}
