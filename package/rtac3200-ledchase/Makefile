# SPDX-License-Identifier: MIT
include $(TOPDIR)/rules.mk

PKG_NAME:=rtac3200-ledchase
PKG_VERSION:=1.0
PKG_RELEASE:=1
PKG_LICENSE:=MIT
PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)

include $(INCLUDE_DIR)/package.mk

define Package/rtac3200-ledchase
  SECTION:=utils
  CATEGORY:=Utilities
  TITLE:=LED sweep for the ASUS RT-AC3200 (three lamps)
endef

define Package/rtac3200-ledchase/description
  Knight-Rider style sweep across white:power, white:wps and red:wan.
  Detaches the current triggers, runs the sweep, then hands the lamps back
  to /etc/init.d/led so the configured behaviour returns.
endef

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
	$(CP) ./src/* $(PKG_BUILD_DIR)/
endef

define Build/Compile
	$(TARGET_CC) $(TARGET_CFLAGS) $(TARGET_LDFLAGS) \
		-o $(PKG_BUILD_DIR)/ledchase $(PKG_BUILD_DIR)/ledchase.c
endef

define Package/rtac3200-ledchase/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/ledchase $(1)/usr/bin/ledchase
endef

$(eval $(call BuildPackage,rtac3200-ledchase))
