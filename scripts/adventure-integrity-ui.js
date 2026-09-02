import{readCampaigns,campaignById}from'./campaign-state.js?v=20260902-encounters1';
import{readAdventures,writeAdventures}from'./adventure-state.js?v=20260902-adventures1';
import{reconcileAdventureCampaignRefs}from'./adventure-integrity.js?v=20260902-adventures2';
const campaignId=new URLSearchParams(location.search).get('campaign')||'';
if(campaignId){const campaign=campaignById(readCampaigns(),campaignId),result=reconcileAdventureCampaignRefs(readAdventures(),campaign);if(result.changed)writeAdventures(result.list)}
