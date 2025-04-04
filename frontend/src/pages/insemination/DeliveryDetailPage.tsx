import React from 'react';
import { useParams } from 'react-router-dom';

const DeliveryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div className="delivery-detail-page">
      <h1>Szczegóły dostawy #{id}</h1>
      <p>Ta funkcjonalność jest w trakcie implementacji.</p>
    </div>
  );
};

export default DeliveryDetailPage;