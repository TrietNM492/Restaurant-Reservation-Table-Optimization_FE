import { tableAllocationApi } from './tableAllocationService';

// BE has no separate combination endpoint. Request its largest result set, then show combinations.
// Singles are preferred by BE; an empty combination list does not imply no tables are available.
export const multiTableCombinationApi = {
  recommend: (request, signal) => tableAllocationApi.recommend({ ...request, allowCombination: true, maxResults: 10 }, signal),
};
