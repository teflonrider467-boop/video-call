class PeerService {
    constructor() {
        // if we do not have an existing peer we will create one
        if (!this.peer){
            this.peer = new RTCPeerConnection({
                //pass the iceServers, we will be using icce servers of google
                iceServers: [{
                    urls: [
                        "stun:stun.l.google.com:19302",// these are open servers
                        "stun:global.stun.twilio.com:3478",// these are open servers
                      ],
                }]
            })
        }
    }

    // method for calling another person
    async getOffer() {
        // if we do not have a peer(a person in room) this method won't get hit
        if(this.peer){
            const offer = await this.peer.createOffer();
            await this.peer.setLocalDescription(new RTCSessionDescription(offer));
            return offer;
        }else{
            console.log("Offer alreadt sent");
        }
    }

    // method for accepting the call
    async getAnswer(offer){
        if(this.peer){
            await this.peer.setRemoteDescription(offer);
            const ans = await this.peer.createAnswer();
            await this.peer.setLocalDescription(new RTCSessionDescription(ans));
            return ans;
        }
    }

    // method for what happens after accepting the call
    async setLocalDescription(ans){
        if (this.peer){
            await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
        }   
    }
}

export default new PeerService();