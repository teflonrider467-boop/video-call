class PeerService {
    constructor() {
        // if we do not have an existing peer we will create one
        if (!this.peer){
            this.peer = new RTCPeerConnection({
                //pass the iceServers, we will be using ice servers of google
                iceServers: [{
                    urls: [
                        "stun:stun.l.google.com:19302",// these are open servers
                        "stun:global.stun.twilio.com:3478",// these are open servers
                      ],
                }]
            })
        }
    }

    // New method to create a data channel
    async createDataChannel() {
        // Create a new data channel for sending and receiving messages
        const dataChannel = this.peer.createDataChannel("chat", { negotiated: true, id: 0 });
        // need to change id:0 to id: vtalix_appointment_2 for uniqueness, id is a unique identifier to the data channel

        // Handle message sending and receiving through the data channel
        dataChannel.onopen = () => {
            console.log("Data Channel opened");
        };

        dataChannel.onmessage = (event) => {
            console.log("Message from Data Channel:", event.data);
        };

        dataChannel.onclose = () => {
            console.log("Data Channel closed");
        };

        this.dataChannel = dataChannel; // Save the data channel for later use
    }

    // method for calling another person
    async getOffer() {
        // if we do not have a peer(a person in room) this method won't get hit
        if(this.peer){
            const offer = await this.peer.createOffer();
            await this.peer.setLocalDescription(new RTCSessionDescription(offer));
            return offer;
        }else{
            console.log("Offer already sent");
        }
    }

    // method for accepting the call
    async getAnswer(offer){
        if(this.peer){
            await this.peer.setRemoteDescription(offer);
            const ans = await this.peer.createAnswer();
            await this.peer.setLocalDescription(new RTCSessionDescription(ans));

            this.createDataChannel();
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