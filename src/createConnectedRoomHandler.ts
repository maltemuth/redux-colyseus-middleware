import { Room } from "colyseus";
import { Schema } from "@colyseus/schema";
import { Store, AnyAction, Action, createStore } from "redux";

export type StoreFactory<
  StateModel = any,
  ActionType extends Action<any> = AnyAction
> = () => Store<StateModel, ActionType>;

export class ConnectedRoom<
  StateModel extends Schema,
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

const createConnectedRoomHandler = <
  StateModel extends Schema,
  ActionType extends Action<any>
>(
  storeFactory: StoreFactory<StateModel, ActionType>
): { new (): ConnectedRoom<StateModel, ActionType> } =>
  class extends ConnectedRoom<StateModel, ActionType> {
    public createStore = storeFactory;
  };

export default createConnectedRoomHandler;
