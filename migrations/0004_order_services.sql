-- An order can include several services. orders.service_id stays as the first (primary) service.
CREATE TABLE order_services (
  order_id INTEGER NOT NULL REFERENCES orders(id),
  service_id INTEGER NOT NULL REFERENCES services(id),
  PRIMARY KEY (order_id, service_id)
);
CREATE INDEX idx_order_services_service ON order_services(service_id);
INSERT INTO order_services (order_id, service_id) SELECT id, service_id FROM orders WHERE service_id IS NOT NULL;
