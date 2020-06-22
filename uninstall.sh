echo not0900 uninstall script
echo dont expect this to go well
echo uninstalling dependencies
rm -rf node_modules
echo stopping service
systemctl stop not0900
echo disabling service
systemctl disable not0900
echo deleting required files...
rm /etc/systemd/system/not0900.service
echo uninstallation complete