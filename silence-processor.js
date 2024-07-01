class SilenceProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this._silenceThreshold = 0.01;
        this._silenceDuration = 2000; // in milliseconds
        this._silenceStart = null;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input.length > 0) {
            const channelData = input[0];
            const sum = channelData.reduce((acc, val) => acc + val * val, 0);
            const rms = Math.sqrt(sum / channelData.length);

            if (rms < this._silenceThreshold) {
                if (this._silenceStart === null) {
                    this._silenceStart = currentTime * 1000; // convert to milliseconds
                } else if (currentTime * 1000 - this._silenceStart > this._silenceDuration) {
                    this.port.postMessage('silence');
                    this._silenceStart = null;
                }
            } else {
                this._silenceStart = null;
            }
        }

        return true;
    }
}

registerProcessor('silence-processor', SilenceProcessor);
