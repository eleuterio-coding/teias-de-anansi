import{readCampaigns,writeCampaigns,campaignById}from'./campaign-state.js?v=20261022-chronicles-final3';
import{readAdventures,writeAdventures}from'./adventure-state.js?v=20261022-chronicles-final3';
import{reconcileAdventureCampaignRefs}from'./adventure-integrity.js?v=20261016-current-status2';
const campaignId=new URLSearchParams(location.search).get('campaign')||'';
if(campaignId){const campaigns=readCampaigns(),campaign=campaignById(campaigns,campaignId),result=reconcileAdventureCampaignRefs(readAdventures(),campaign);if(result.changed){writeAdventures(result.list);if(result.campaign)writeCampaigns(campaigns.map(row=>row.id===campaignId?result.campaign:row))}}