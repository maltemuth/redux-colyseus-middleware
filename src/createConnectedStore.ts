import {
  createStore,
  applyMiddleware,
  Middleware,
  Reducer,
  Store,
  Action,
  AnyAction,
  // this is needed for tsc, although it is not used
  Dispatch,
} from "redux";

import { Client } from "./createClient";

export const REMOTE_STATE_UPDATE = "REMOTE_STATE_UPDATE";

interface RemoteAction<StateModel> extends Action {
  type: typeof REMOTE_STATE_UPDATE;
  newState: StateModel;
}

/**
 * returns a reducer that wraps the original reducer and handles top-level remote updates
 * @param originalReducer
 */
const withRemoteRootReducer: <StateModel>(
  orignalReducer: Reducer<StateModel>
) => Reducer<StateModel> = (originalReducer: Reducer) => <StateModel>(
  state: StateModel,
  action: RemoteAction<StateModel> | AnyAction
) => {
  const { type } = action;
  if (type === REMOTE_STATE_UPDATE) {
    const { newState } = action;

    return newState;
  }

  return originalReducer(state, action);
};

/**
 * returns a middleware that sends actions marked with { _remote: true } to the server
 * @param client
 */
const createRemoteDispatcherMiddleWare = (client: Client): Middleware => (
  store
) => {
  client.subscribe((newState) =>
    store.dispatch({ type: REMOTE_STATE_UPDATE, newState })
  );
  return (next) => (action) => {
    if (action._remote === true && client.isConnected()) {
      client.sendAction(action);
    } else {
      return next(action);
    }
  };
};

/**
 * creates a store from the given reducer and middlewares that is also equipped
 * - with the middleware that sends actions to the remote server
 * - with the reducer that handles remote updates
 * @param client
 * @param reducer
 * @param middlewares
 */
const createConnectedStore = <StateModel = any>(
  client: Client,
  reducer: Reducer<StateModel>,
  middlewares: Middleware[] = []
): Store<StateModel> => {
  return createStore(
    withRemoteRootReducer(reducer),
    applyMiddleware(createRemoteDispatcherMiddleWare(client), ...middlewares)
  );
};

export default createConnectedStore;
