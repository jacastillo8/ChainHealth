import requests, time, json, argparse, sys
from clients import MQTTClient
from getmac import get_mac_address as gma
from gpiozero import LED, Button
from os import path, remove

def on_operation():
    while True:
        res = send_mac()
        if res.json()['status'] != 'approved':
            raise Exception('Device has been rejected by Broker')
        time.sleep(5)
        
button = Button(2)
leds = { 'green': LED(14), 'yellow': LED(18), 'red': LED(15) }

def turn_led(color):
    color = color.lower()
    [led.off() for led in leds.values()]
    leds[color].on()
    
def send_mac(ip_address, port):
    mac = gma()
    # Static url that points to mqtt chainmed endpoint
    url = 'http://{}:{}/devices/add'.format(ip_address, port)
    
    headers = {'Content-type': 'application/json'}
    data = {
        'mac': mac
    }
    res = requests.post(url=url, json=data, headers=headers)
    return res

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='IoMT prototype that connects to ChainHealth.')
    parser.add_argument('-h', '--host', dest='host', type=str, help='Host IP Address.')
    parser.add_argument('-p', '--port', dest='port', type=int, help='Port Number.')

    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit(1)

    args = parser.parse_args()

    while True:       
        if not path.exists('certs/ccp.json'):
            paired = False
            while not paired:
                turn_led('red')
                button.wait_for_press()
                
                turn_led('yellow')
            
                res = send_mac(args.host, args.port)
                counter = 30
                while res.json()['status'] == 'pending':
                    if counter == 0:
                        break
                    res = send_mac(args.host, args.port)
                    counter -= 1
                    time.sleep(1)
                if counter != 0 and res.json()['status'] == 'approved':
                    response = res.json()
                    ccp = { 'broker': response['ccp']['host'], 'port': response['ccp']['port'], 'user': response['user'] }
                    pem = response['pem']
                    
                    with open('certs/ccp.json', 'w+') as file:
                        json.dump(ccp, file)
                        
                    with open('certs/device.pem', 'w+') as cert:
                        cert.write(pem)
                    paired = not paired
        else:
            res = send_mac(args.host, args.port)
            if res.json()['status'] != 'approved':
                remove('certs/ccp.json')
                remove('certs/device.pem')
            else:
                # If pairing is successfull
                turn_led('green')
                with open('certs/ccp.json') as file:
                    ccp = json.load(file)
                
                broker = ccp['broker']
                port = int(ccp['port'])
                user = ccp['user']
                
                # username used in topic? CHECK
                client = MQTTClient(broker, port, username=user, 
                                    topic='mysignals/sensors/{}/#'.format(user), qos=2, 
                                    tls=True, verbose=True)
                
                # Assign callback to object
                client.on_operation = on_operation
                # Client connection
                client.connect()