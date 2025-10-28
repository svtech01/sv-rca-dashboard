export class Config {
  constructor() {
    this.CONNECT_DISPOSITIONS = ["Connected", "Left voicemail"];
    this.DEFAULT_DIAL_AT_A_TIME = 4;
    this.DEFAULT_MAX_ATTEMPTS = 10;
    this.PILOT_LIST_NAME = "NAICS";
    this.TARGET_CONNECT_UPLIFT_PCT = 30;
    this.SUCCESS_CRITERIA_CONNECT_UPLIFT_PCT = 25;
    this.SUCCESS_CRITERIA_VOICEMAIL_UPLIFT_PCT = 15;
    this.COOLDOWN_DAYS = 7;
  }
}
