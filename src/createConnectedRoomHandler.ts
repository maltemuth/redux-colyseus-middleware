import { Room } from "colyseus";
import { Store, AnyAction, Action, createStore } from "redux";

export type StoreFactory<
  StateModel = any,
  ActionType extends Action<any> = AnyAction
> = () => Store<StateModel, ActionType>;

export abstract class ConnectedRoom<
  StateModel = any,
  ActionType extends Action<any> = AnyAction
> extends Room<StateModel> {
  public createStore: StoreFactory<StateModel, ActionType> = () =>
    createStore((_ = {}) => _);

  public onCreate() {
    const store = this.createStore();
    this.setState(store.getState());

    this.onMessage("action", (client, action) => {
      store.dispatch({
        ...action,
        client,
      });
      this.state = store.getState();
    });
  }
}

const createConnectedRoomHandler = <StateModel, ActionType extends Action<any>>(
  storeFactory: StoreFactory<StateModel, ActionType>
) =>
  class extends ConnectedRoom<StateModel, ActionType> {
    public createStore = storeFactory;
  };

export default createConnectedRoomHandler;
