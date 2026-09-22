import{readCampaigns,writeCampaigns,campaignById}from'./campaign-state.js?v=20260922-adventure-workspace2';
import{readAdventures,writeAdventures}from'./adventure-state.js?v=20260922-adventure-workspace2';
import{reconcileAdventureCampaignRefs}from'./adventure-integrity.js?v=20260922-adventure-workspace2';
const campaignId=new URLSearchParams(location.search).get('campaign')||'';
if(campaignId){const campaigns=readCampaigns(),campaign=campaignById(campaigns,campaignId),result=reconcileAdventureCampaignRefs(readAdventures(),campaign);if(result.changed){writeAdventures(result.list);if(result.campaign)writeCampaigns(campaigns.map(row=>row.id===campaignId?result.campaign:row))}}