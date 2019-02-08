import { getClient } from '../../config/uclusionClient';

export const INVESTIBLE_CREATED = 'INVESTIBLE_CREATED';
export const CREATE_INVESTIBLE = 'CREATE_INVESTIBLE';

export const createInvestible = (title, description, category) => ({
  type: CREATE_INVESTIBLE,
  title,
  description,
  category,
});

export const investibleCreated = investible => ({
  type: INVESTIBLE_CREATED,
  investible,
});

export const createTemplateInvestible = (params = {}) => (dispatch) => {
  dispatch(createInvestible(params.title, params.description));
  const clientPromise = getClient();
  return clientPromise.then(client => client.investibles.create(params.title, params.description, [params.category]))
    .catch((error) => {
      console.log(error);
      // these two calls make sure we update the UI. We _really_ need error handling to be better
      dispatch(investibleCreated([]));
    });
};
