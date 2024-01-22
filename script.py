from typing import Dict
import requests


from time import sleep

from requests.models import ReadTimeoutError
from datetime import datetime, timedelta


def get_previous_day():
    # Get the current date
    current_date = datetime.now()

    # Calculate the previous day
    previous_day = current_date - timedelta(days=1)

    # Format the previous day as "dd.mm.yyyy"
    previous_day_formatted = previous_day.strftime("%d.%m.%Y")

    return previous_day_formatted

class NSE:

    BASE_URL = "https://www.nseindia.com/"

    HEADERS = {
        'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36',
        'accept-language': 'en-US,en;q=0.9,ta;q=0.8'
    }

    def connect_nse(self, uri) -> Dict:
        url = f"{self.BASE_URL}{uri}"
        try:
            response = self.session.get(url,
                                        headers=self.HEADERS,
                                        timeout=5,
                                        cookies=self.cookies)
            if response.status_code in [200, 201]:
                return {"status": "success", "response": response.json()}
            print(response.text)
        except requests.exceptions.ReadTimeout as e:
            print(f"Read Timeout.... {e}")
            sleep(2)
            self.refresh_cookies()
            return self.connect_nse(uri)
        return {"status": "failure", "response": response.text}

    def refresh_cookies(self) -> None:
        try:
            request = self.session.get(self.BASE_URL,
                                   headers=self.HEADERS,
                                   timeout=5)
        except ReadTimeoutError as e:
            print("Cookies Timeout Error")
            self.refresh_cookies()
        self.cookies = dict(request.cookies)
    
    def get_current_expiry(self, expiry_dates):
        expiry_date = expiry_dates[0]
        date_format = "%d-%b-%Y"
        now = datetime.now()
        formated_expiry_date = datetime.strptime(expiry_date, date_format)        
        dates = {}
        for dat in expiry_dates:
            if dat in dates.keys():
                dates[dat] = 1
            else:
                dates.update({dat: 1})
        if formated_expiry_date < now:
            _ = dates.pop(expiry_date)
            expiry_date = list(dates.keys())[0]
        return expiry_date      

    def fetch_active_contracts(self, symbol="NIFTY") -> Dict:
        uri = f"api/quote-derivative?symbol={symbol}"
        data = self.connect_nse(uri)
        instrument_type = "Stock Options"
        if symbol in ["NIFTY","BANKNIFTY","FINNIFTY"]:
            instrument_type = "Index Options"
        if data['status'] == "success":
            expiry_date = self.get_current_expiry(data['response']['expiryDates'])
            contracts = list(
                filter(
                    lambda x: x['metadata'][
                        'instrumentType'] == instrument_type and x['metadata']
                    ['expiryDate'] == expiry_date, data['response']['stocks']))
            
            if contracts:
                new_contracts = []
                for item in contracts:
                    contract = {
                        self.previous_day:f"{item['metadata']['optionType']}{item['metadata']['strikePrice']}"
                    }
                    contract.update(item.pop('metadata'))
                    contract['nse_identifier'] = contract.pop('identifier')
                    contract['Support'] = f"{contract['strikePrice']-contract['closePrice']}"  if contract['optionType'] == "Put" else None
                    contract['Resistance'] = f"{contract['strikePrice']+contract['closePrice']}"  if contract['optionType'] == "Call" else None
                    new_contracts.append(contract)
                    
            return new_contracts if new_contracts else []
        return []


    def __init__(self) -> None:
        self.session = requests.Session()
        self.refresh_cookies()
        self.previous_day = get_previous_day()
        
if __name__ == "__main__":
    index = "NIFTY"
    nse = NSE()
    active = nse.fetch_active_contracts(index)
    import json
    with open(f"{index}.json", mode='w+') as json_out:
        json.dump(active, json_out)
