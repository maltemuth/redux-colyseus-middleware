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

interface RemoteStateUpdateAction<StateModel> extends Action {
  type: typeof REMOTE_STATE_UPDATE;
  newState: StateModel;
}

export type RemoteStatePatcher<StateModel, RemoteStateModel> = (
  localState: StateModel,
  remoteState: RemoteStateModel
) => StateModel;
export type ReducerMapper = <
  StateModel,
  RemoteStateModel,
  ActionType extends Action
>(
  originalReducer: Reducer<StateModel>,
  patchLocalStateWithRemote: RemoteStatePatcher<StateModel, RemoteStateModel>
) => Reducer<
  StateModel,
  ActionType | RemoteStateUpdateAction<RemoteStateModel>
>;

/**
 * returns a reducer that wraps the original reducer and handles top-level remote updates
 * @param originalReducer
 */
const withRemoteRootReducer: ReducerMapper = <
  StateModel,
  RemoteStateModel,
  ActionType extends Action
>(
  originalReducer: Reducer<StateModel, ActionType>,
  patchLocalStateWithRemote: RemoteStatePatcher<StateModel, RemoteStateModel>
) => {
  const wrappedReducer: Reducer<
    StateModel,
    ActionType | RemoteStateUpdateAction<RemoteStateModel>
  > = (
    state: StateModel | undefined,
    action: RemoteStateUpdateAction<RemoteStateModel> | AnyAction
  ) => {
    const { type } = action;

    if (type === REMOTE_STATE_UPDATE) {
      const { newState } = action as RemoteStateUpdateAction<RemoteStateModel>;

      if (typeof state !== "undefined") {
        return patchLocalStateWithRemote(state, newState);
      }
    }

    return originalReducer(state, action as ActionType);
  };

  return wrappedReducer;
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
const createConnectedStore = <StateModel = any, RemoteStateModel = any>(
  client: Client,
  reducer: Reducer<StateModel>,
  middlewares: Middleware[] = [],
  patchLocalStateWithRemote: RemoteStatePatcher<
    StateModel,
    RemoteStateModel
  > = (_, __) => (__ as unknown) as StateModel
): Store<StateModel> => {
  return createStore(
    withRemoteRootReducer(reducer, patchLocalStateWithRemote),
    applyMiddleware(createRemoteDispatcherMiddleWare(client), ...middlewares)
  );
};

export default createConnectedStore;
