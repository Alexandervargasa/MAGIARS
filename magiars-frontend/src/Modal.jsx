import React from "react";
import "./Modal.css";

function Modal({ onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2>Esta aplicación es para uso empresarial</h2>
        <p>Por favor asegúrese de tener autorización para continuar.</p>
        <button className="close-button" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
}

export default Modal;
