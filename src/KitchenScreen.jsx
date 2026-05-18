import React, {
  useState,
  useEffect,
  useRef,
  useCallback
} from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './KitchenScreen.css';

// Backend URL
const API_URL = 'https://cafe-os-backend.onrender.com';

const getOrderKey = (order) =>
  String(order._id || order.id);

const getOrderRequestId = (order) =>
  String(order._id || order.id);

export default function KitchenPage() {

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrders, setUpdatingOrders] = useState([]);
  const pendingStatusRef = useRef(new Map());

  const applyPendingStatuses = useCallback(
    (incomingOrders) =>
      incomingOrders.map(order => {

        const pendingStatus =
          pendingStatusRef.current.get(
            getOrderKey(order)
          );

        if (pendingStatus) {

          return {
            ...order,
            status: pendingStatus
          };

        }

        return order;

      }),
    []
  );

  // FETCH ORDERS
  const fetchOrders = useCallback(async () => {

    try {

      const res = await axios.get(
        `${API_URL}/orders?t=${Date.now()}`
      );

      setOrders(
        applyPendingStatuses(res.data)
      );

    } catch (err) {

      console.error(
        'Error fetching kitchen orders:',
        err
      );

    } finally {

      setIsLoading(false);

    }
  }, [applyPendingStatuses]);

  // SOCKET CONNECTION
  useEffect(() => {

    fetchOrders();

    const socket = io(API_URL, {
      transports: ['websocket']
    });

    socket.on('orderUpdated', () => {

      console.log(
        '⚡ Kitchen Order Updated'
      );

      fetchOrders();

    });

    const interval = setInterval(
      fetchOrders,
      30000
    );

    return () => {

      clearInterval(interval);

      socket.disconnect();

    };

  }, [fetchOrders]);

  // UPDATE STATUS
  const updateStatus = async (order, status) => {

    const orderKey = getOrderKey(order);
    const requestId = getOrderRequestId(order);

    pendingStatusRef.current.set(
      orderKey,
      status
    );

    // Loading state
    setUpdatingOrders(prev =>
      prev.includes(orderKey)
        ? prev
        : [
            ...prev,
            orderKey
          ]
    );

    setOrders(prevOrders =>
      prevOrders
        .map(order =>
          getOrderKey(order) === orderKey
            ? {
                ...order,
                status
              }
            : order
        )
        .filter(
          order =>
            order.status !== 'Completed'
        )
    );

    try {

      const res = await axios.put(
        `${API_URL}/orders/${encodeURIComponent(requestId)}/status?status=${encodeURIComponent(status)}`,
        { status }
      );

      if (!res.data) {

        throw new Error(
          'Order was not found on the server'
        );

      }

      setOrders(prevOrders =>
        prevOrders
          .map(order => {

            if (
              getOrderKey(order) === orderKey
            ) {

              return {
                ...order,
                ...res.data,
                status:
                  res.data.status || status
              };

            }

            return order;

          })
          .filter(
            order =>
              order.status !== 'Completed'
          )
      );

      // Fresh sync from backend
      await fetchOrders();

    } catch (err) {

      pendingStatusRef.current.delete(
        orderKey
      );

      console.error(
        'Error updating status:',
        err
      );

      await fetchOrders();

    } finally {

      pendingStatusRef.current.delete(
        orderKey
      );

      // Remove loading state
      setUpdatingOrders(prev =>
        prev.filter(
          currentId =>
            currentId !== orderKey
        )
      );

    }
  };

  // MERGE DUPLICATE ITEMS
  const groupIdenticalItems = (items) => {

    const grouped = {};

    items.forEach(item => {

      const addonStr =
        item.addons &&
        item.addons.length > 0
          ? item.addons
              .map(a => a.name)
              .sort()
              .join(',')
          : 'no-addons';

      const key =
        `${item.name}|${addonStr}`;

      if (grouped[key]) {

        grouped[key].quantity += (
          item.quantity || 1
        );

      } else {

        grouped[key] = {
          ...item,
          quantity:
            item.quantity || 1
        };

      }
    });

    return Object.values(grouped);
  };

  // FILTER ORDERS
  const newOrders = orders
    .filter(
      o => o.status === 'Accepted'
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt) -
        new Date(b.createdAt)
    );

  const prepOrders = orders
    .filter(
      o => o.status === 'Preparing'
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt) -
        new Date(b.createdAt)
    );

  const readyOrders = orders
    .filter(
      o => o.status === 'Ready'
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    )
    .slice(0, 20);

  const activeCount =
    newOrders.length +
    prepOrders.length;

  return (

    <div className="kitchen-container">

      {/* LOADING */}

      {isLoading && (

        <div className="kitchen-loading-overlay">

          <div className="kitchen-spinner"></div>

          <h2
            style={{
              color: '#0f172a',
              marginTop: '20px'
            }}
          >
            Syncing Kitchen... 👨‍🍳
          </h2>

        </div>

      )}

      {/* HEADER */}

      <header className="kitchen-header">

        <h1 className="kitchen-title">
          👨‍🍳 Kitchen KDS
        </h1>

        <div className="kitchen-active-count">

          Active Tickets:

          <span className="kitchen-active-number">
            {activeCount}
          </span>

        </div>

      </header>

      {/* MAIN GRID */}

      <main className="kitchen-main-grid">

        {/* NEW ORDERS */}

        <section className="kitchen-column">

          <div className="column-header">

            <h3>
              🚨 New Orders
            </h3>

            <span className="col-count">
              {newOrders.length}
            </span>

          </div>

          <div className="kitchen-grid">

            {newOrders.map(order => {

              const orderId =
                getOrderKey(order);

              const isUpdating =
                updatingOrders.includes(
                  orderId
                );

              return (

                <div
                  key={orderId}
                  className="kitchen-card"
                >

                  <div className="card-top-bar bg-orange">

                    <h3 className="card-order-id">
                      #{order.id}
                    </h3>

                    <span className="card-status-badge">
                      NEW
                    </span>

                  </div>

                  <div className="card-body">

                    <div className="card-customer">
                      👤 {order.customer_name}
                    </div>

                    <div className="item-list">

                      {groupIdenticalItems(
                        order.items
                      ).map(
                        (item, idx) => (

                        <div
                          key={idx}
                          className="item-row"
                        >

                          <div className="item-name-col">

                            {item.name}

                            {item.addons &&
                              item.addons.length > 0 && (

                              <span className="item-addons">

                                + {item.addons
                                  .map(
                                    a => a.name
                                  )
                                  .join(', ')}

                              </span>

                            )}

                          </div>

                          <div className="item-qty">
                            x{item.quantity}
                          </div>

                        </div>

                      ))}

                    </div>

                  </div>

                  <div className="card-action-box">

                    <button
                      className="kitchen-btn"
                      style={{
                        backgroundColor:
                          isUpdating
                            ? '#94a3b8'
                            : '#0ea5e9',
                        cursor:
                          isUpdating
                            ? 'not-allowed'
                            : 'pointer'
                      }}
                      disabled={isUpdating}
                      onClick={() =>
                        updateStatus(
                          order,
                          'Preparing'
                        )
                      }
                    >

                      {isUpdating
                        ? '⏳ Updating...'
                        : '🔥 Start Preparing'}

                    </button>

                  </div>

                </div>

              );
            })}

          </div>

        </section>

        {/* PREPARING */}

        <section className="kitchen-column">

          <div className="column-header">

            <h3>
              🔥 Preparing
            </h3>

            <span className="col-count">
              {prepOrders.length}
            </span>

          </div>

          <div className="kitchen-grid">

            {prepOrders.map(order => {

              const orderId =
                getOrderKey(order);

              const isUpdating =
                updatingOrders.includes(
                  orderId
                );

              return (

                <div
                  key={orderId}
                  className="kitchen-card"
                >

                  <div className="card-top-bar bg-blue">

                    <h3 className="card-order-id">
                      #{order.id}
                    </h3>

                    <span className="card-status-badge">
                      COOKING
                    </span>

                  </div>

                  <div className="card-body">

                    <div className="card-customer">
                      👤 {order.customer_name}
                    </div>

                    <div className="item-list">

                      {groupIdenticalItems(
                        order.items
                      ).map(
                        (item, idx) => (

                        <div
                          key={idx}
                          className="item-row"
                        >

                          <div className="item-name-col">

                            {item.name}

                            {item.addons &&
                              item.addons.length > 0 && (

                              <span className="item-addons">

                                + {item.addons
                                  .map(
                                    a => a.name
                                  )
                                  .join(', ')}

                              </span>

                            )}

                          </div>

                          <div className="item-qty">
                            x{item.quantity}
                          </div>

                        </div>

                      ))}

                    </div>

                  </div>

                  <div className="card-action-box">

                    <button
                      className="kitchen-btn"
                      style={{
                        backgroundColor:
                          isUpdating
                            ? '#94a3b8'
                            : '#22c55e',
                        cursor:
                          isUpdating
                            ? 'not-allowed'
                            : 'pointer'
                      }}
                      disabled={isUpdating}
                      onClick={() =>
                        updateStatus(
                          order,
                          'Ready'
                        )
                      }
                    >

                      {isUpdating
                        ? '⏳ Updating...'
                        : '✅ Mark as Ready'}

                    </button>

                  </div>

                </div>

              );
            })}

          </div>

        </section>

        {/* READY */}

        <section className="kitchen-column">

          <div className="column-header">

            <h3>
              ✅ Ready to Handover
            </h3>

            <span className="col-count">
              {readyOrders.length}
            </span>

          </div>

          <div className="kitchen-grid">

            {readyOrders.map(order => {

              const orderId =
                getOrderKey(order);

              const isUpdating =
                updatingOrders.includes(
                  orderId
                );

              return (

                <div
                  key={orderId}
                  className="kitchen-card"
                >

                  <div className="card-top-bar bg-green">

                    <h3 className="card-order-id">
                      #{order.id}
                    </h3>

                    <span className="card-status-badge">
                      DONE
                    </span>

                  </div>

                  <div className="card-body">

                    <div className="card-customer">
                      👤 {order.customer_name}
                    </div>

                    <div className="item-list">

                      {groupIdenticalItems(
                        order.items
                      ).map(
                        (item, idx) => (

                        <div
                          key={idx}
                          className="item-row"
                        >

                          <div className="item-name-col">

                            {item.name}

                            {item.addons &&
                              item.addons.length > 0 && (

                              <span className="item-addons">

                                + {item.addons
                                  .map(
                                    a => a.name
                                  )
                                  .join(', ')}

                              </span>

                            )}

                          </div>

                          <div className="item-qty">
                            x{item.quantity}
                          </div>

                        </div>

                      ))}

                    </div>

                  </div>

                  <div className="card-action-box">

                    <button
                      className="kitchen-btn"
                      style={{
                        backgroundColor:
                          isUpdating
                            ? '#94a3b8'
                            : '#ef4444',
                        cursor:
                          isUpdating
                            ? 'not-allowed'
                            : 'pointer'
                      }}
                      disabled={isUpdating}
                      onClick={() =>
                        updateStatus(
                          order,
                          'Completed'
                        )
                      }
                    >

                      {isUpdating
                        ? '⏳ Updating...'
                        : '🤝 Hand Over'}

                    </button>

                  </div>

                </div>

              );
            })}

          </div>

        </section>

      </main>

    </div>
  );
}
