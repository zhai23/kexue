// ==UserScript==
// @name         获取iframe链接并复制小游戏地址
// @namespace    zhai
// @version      0.5.0
// @description  获取当前网页中指定iframe元素的src链接，一键复制小游戏地址到剪贴板
// @author       翟成涛
// @match        *://*.sensortower.com/*
// @match        *://sensortower.com/*
// @match        *://*.sensortower-china.com/*
// @match        *://sensortower-china.com/*
// @grant        none
// @license           AGPL License
// @charset		      UTF-8
// @run-at            document-idle
// @downloadURL https://raw.githubusercontent.com/zhai23/kexue/refs/heads/main/sensortower复制试玩链接.js
// @updateURL https://raw.githubusercontent.com/zhai23/kexue/refs/heads/main/sensortower复制试玩链接.js
// ==/UserScript==

(function() {
    'use strict';

    // 只在顶级窗口中运行，如果在iframe中则退出
    if (window !== window.top) {
        console.log('脚本在iframe中，退出执行');
        return;
    }
    
    console.log('🚀 小游戏链接获取器脚本启动 - 运行在主页面');
    console.log('当前页面URL:', window.location.href);
    console.log('');
    console.log('📋 使用说明:');
    console.log('  • 脚本会自动在左下角创建【复制游戏链接】按钮');
    console.log('  • 找到目标链接时按钮变为绿色，点击即可复制链接');
    console.log('  • 快捷键：Ctrl+Shift+C 快速复制链接');
    console.log('  • 脚本会自动监听页面中的iframe变化');
    console.log('  • 支持的目标：包含 x-ad-assets.s3.amazonaws.com 的iframe链接');
    console.log('');

    let 已处理的链接集合 = new Set();
    let 最新游戏链接 = null; // 保存最新发现的目标游戏链接
    
    // 使用localStorage保存链接
    const 存储键名 = '小游戏链接获取器_最新链接';
    
    /**
     * 加载已保存的游戏链接
     * @description 从localStorage中加载最新的目标游戏链接
     * @returns {void}
     */
    function 加载保存的链接() {
        try {
            const 保存的链接 = localStorage.getItem(存储键名);
            if (保存的链接) {
                最新游戏链接 = 保存的链接;
                console.log('📁 从存储中加载了最新游戏链接:', 最新游戏链接);
            } else {
                console.log('📁 存储中没有保存的游戏链接');
            }
        } catch (错误) {
            console.warn('📁 加载保存的链接时出错:', 错误);
            最新游戏链接 = null;
        }
    }
    
    /**
     * 保存游戏链接到存储
     * @description 将最新的目标游戏链接保存到localStorage
     * @param {string} 链接 - 游戏链接URL
     * @returns {void}
     */
    function 保存链接到存储(链接) {
        try {
            localStorage.setItem(存储键名, 链接);
            console.log('💾 已保存最新游戏链接到存储:', 链接);
        } catch (错误) {
            console.warn('💾 保存链接到存储时出错:', 错误);
        }
    }
    
    /**
     * 设置最新游戏链接
     * @description 设置并保存最新发现的目标游戏链接
     * @param {string} 链接 - 游戏链接URL
     * @returns {void}
     */
    function 设置最新游戏链接(链接) {
        if (链接 && 链接.includes('x-ad-assets.s3.amazonaws.com')) {
            最新游戏链接 = 链接;
            保存链接到存储(链接);
            console.log('🎯 设置最新目标游戏链接:', 链接);
            更新按钮状态();
        }
    }

    // 页面加载时先加载保存的链接
    加载保存的链接();

    /**
     * 复制链接到剪贴板
     * @description 将游戏链接复制到剪贴板
     * @param {string} 链接 - 要复制的链接
     * @returns {Promise<boolean>} 复制是否成功
     */
    async function 复制链接到剪贴板(链接) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(链接);
                console.log('✅ 链接已复制到剪贴板:', 链接);
                return true;
            } else {
                // 备选方案：使用传统方法
                const 临时输入框 = document.createElement('textarea');
                临时输入框.value = 链接;
                临时输入框.style.position = 'fixed';
                临时输入框.style.left = '-999999px';
                临时输入框.style.top = '-999999px';
                document.body.appendChild(临时输入框);
                临时输入框.focus();
                临时输入框.select();
                const 成功 = document.execCommand('copy');
                document.body.removeChild(临时输入框);
                
                if (成功) {
                    console.log('✅ 链接已复制到剪贴板 (备选方案):', 链接);
                    return true;
                } else {
                    console.error('❌ 复制失败');
                    return false;
                }
            }
        } catch (错误) {
            console.error('❌ 复制到剪贴板时出错:', 错误);
            return false;
        }
    }

    /**
     * 获取iframe元素的src链接
     * @description 深度搜索页面中所有iframe元素，包括嵌套的iframe，查找目标游戏链接
     * @returns {void}
     * @example 自动在页面加载后执行
     * @note 使用递归搜索确保找到所有iframe
     */
    function 获取iframe链接() {
        console.log('🔍 开始搜索页面中的所有iframe元素...');
        let 总计iframe数量 = 0;
        let 找到的目标链接 = [];
        
        /**
         * 递归搜索iframe
         * @param {Document} 文档 - 要搜索的文档对象
         * @param {string} 层级描述 - 描述当前搜索层级
         */
        function 递归搜索iframe(文档, 层级描述 = '主页面') {
            try {
                const iframe元素列表 = 文档.querySelectorAll('iframe');
                console.log(`${层级描述}中找到 ${iframe元素列表.length} 个iframe元素`);
                总计iframe数量 += iframe元素列表.length;
                
                iframe元素列表.forEach((iframe元素, 索引) => {
                    const src链接 = iframe元素.getAttribute('src');
                    console.log(`检查${层级描述}iframe [${索引 + 1}]:`, src链接);
                    
                    if (src链接) {
                        if (src链接.includes('x-ad-assets.s3.amazonaws.com')) {
                            console.log(`✅ 找到目标iframe链接 [${层级描述}-${索引 + 1}]:`, src链接);
                            找到的目标链接.push(src链接);
                        } else if (src链接.includes('amazonaws.com') || 
                                  src链接.includes('.html') ||
                                  src链接.includes('game') ||
                                  src链接.includes('play')) {
                            console.log(`🔍 找到可能的游戏链接 [${层级描述}-${索引 + 1}]:`, src链接);
                        }
                    }
                    
                    // 尝试访问iframe内部文档（如果同域）
                    try {
                        if (iframe元素.contentDocument) {
                            递归搜索iframe(iframe元素.contentDocument, `${层级描述}-iframe${索引 + 1}`);
                        }
                    } catch (跨域错误) {
                        console.log(`${层级描述}-iframe${索引 + 1} 是跨域iframe，无法访问内部`);
                    }
                });
            } catch (错误) {
                console.warn(`搜索${层级描述}时出错:`, 错误);
            }
        }
        
        // 开始递归搜索
        递归搜索iframe(document);
        
        console.log(`📊 搜索完成: 总计找到 ${总计iframe数量} 个iframe元素`);
        console.log(`🎯 发现 ${找到的目标链接.length} 个目标游戏链接:`, 找到的目标链接);
        
        // 处理找到的目标链接
        if (找到的目标链接.length > 0) {
            // 使用最新找到的目标链接
            const 选择的链接 = 找到的目标链接[找到的目标链接.length - 1];
            设置最新游戏链接(选择的链接);
        }
    }

    /**
     * 监听DOM变化
     * @description 使用MutationObserver监听页面DOM变化，当有新的iframe元素添加时自动检测
     * @returns {void}
     * @note 适用于动态加载内容的网页
     */
    function 监听DOM变化() {
        const 观察器 = new MutationObserver((变化列表) => {
            变化列表.forEach((变化) => {
                if (变化.type === 'childList') {
                    变化.addedNodes.forEach((节点) => {
                        if (节点.nodeType === Node.ELEMENT_NODE) {
                            // 检查新添加的节点是否为iframe或包含iframe
                            if (节点.tagName === 'IFRAME' || 节点.querySelector('iframe')) {
                                console.log('检测到新的iframe元素，重新扫描...');
                                获取iframe链接();
                            }
                        }
                    });
                }
            });
        });

        // 开始观察
        观察器.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * 更新复制按钮状态
     * @description 根据是否有最新游戏链接更新按钮显示
     * @returns {void}
     */
    function 更新按钮状态() {
        const 按钮 = document.getElementById('小游戏复制按钮');
        if (按钮 && !按钮.disabled) {
            if (最新游戏链接) {
                按钮.textContent = '复制游戏链接';
                按钮.style.background = '#28a745 !important'; // 绿色表示找到了链接
            } else {
                按钮.textContent = '复制游戏链接';
                按钮.style.background = '#6c757d !important'; // 灰色表示暂未找到
            }
        }
    }

    /**
     * 创建复制按钮
     * @description 在页面左下角创建一个浮动按钮，用户可以手动复制链接
     * @returns {void}
     */
    function 创建复制按钮() {
        // 检查是否已经创建了按钮
        if (document.getElementById('小游戏复制按钮')) {
            console.log('按钮已存在，跳过创建');
            return;
        }

        const 按钮 = document.createElement('button');
        按钮.id = '小游戏复制按钮';
        按钮.textContent = '复制游戏链接';
        
        // 简洁的CSS样式
        按钮.style.cssText = `
            position: fixed !important;
            bottom: 20px !important;
            left: 20px !important;
            z-index: 2147483647 !important;
            background: #6c757d !important;
            color: white !important;
            border: 2px solid #ffffff !important;
            padding: 12px 18px !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            font-size: 16px !important;
            font-weight: bold !important;
            font-family: Arial, sans-serif !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5) !important;
            min-width: 160px !important;
            text-align: center !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            margin: 0 !important;
            transform: none !important;
            transition: all 0.3s ease !important;
            line-height: 1.4 !important;
            white-space: nowrap !important;
            overflow: visible !important;
            pointer-events: auto !important;
        `;

        // 添加鼠标悬停效果
        按钮.addEventListener('mouseenter', () => {
            按钮.style.transform = 'scale(1.05) !important';
            按钮.style.boxShadow = '0 6px 20px rgba(0,0,0,0.6) !important';
        });
        
        按钮.addEventListener('mouseleave', () => {
            按钮.style.transform = 'scale(1) !important';
            按钮.style.boxShadow = '0 4px 15px rgba(0,0,0,0.5) !important';
        });

        按钮.addEventListener('click', async () => {
            console.log('用户点击复制按钮');
            console.log('当前最新游戏链接:', 最新游戏链接);
            
            按钮.textContent = '搜索中...';
            按钮.disabled = true;
            
            let 选择的链接 = null;
            
            // 优先使用已保存的链接
            if (最新游戏链接) {
                console.log('使用已保存的游戏链接:', 最新游戏链接);
                选择的链接 = 最新游戏链接;
            } else {
                // 如果没有保存的链接，重新搜索
                console.log('没有保存的链接，重新搜索...');
                获取iframe链接(); // 重新执行完整搜索
                
                // 搜索后检查是否找到了链接
                if (最新游戏链接) {
                    选择的链接 = 最新游戏链接;
                    console.log('重新搜索后找到链接:', 选择的链接);
                }
            }
            
            if (选择的链接) {
                console.log(`手动触发：复制游戏链接:`, 选择的链接);
                按钮.textContent = '复制中...';
                按钮.style.background = '#007bff !important';
                
                // 开始复制
                const 复制成功 = await 复制链接到剪贴板(选择的链接);
                
                if (复制成功) {
                    按钮.textContent = '复制游戏链接';
                    按钮.style.background = '#28a745 !important';
                    
                    // 显示成功提示
                    const 提示窗口 = document.createElement('div');
                    提示窗口.style.cssText = `
                        position: fixed !important;
                        bottom: 80px !important;
                        left: 20px !important;
                        z-index: 2147483647 !important;
                        background: #28a745 !important;
                        color: white !important;
                        border-radius: 5px !important;
                        padding: 10px 15px !important;
                        font-family: Arial, sans-serif !important;
                        font-size: 14px !important;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.3) !important;
                        opacity: 0 !important;
                        transition: opacity 0.3s ease !important;
                    `;
                    提示窗口.textContent = '链接已复制到剪贴板！';
                    document.body.appendChild(提示窗口);
                    
                    // 显示动画
                    setTimeout(() => {
                        提示窗口.style.opacity = '1';
                    }, 10);
                    
                    // 3秒后移除提示
                    setTimeout(() => {
                        提示窗口.style.opacity = '0';
                        setTimeout(() => {
                            if (document.body.contains(提示窗口)) {
                                document.body.removeChild(提示窗口);
                            }
                        }, 300);
                    }, 3000);
                    
                } else {
                    按钮.textContent = '复制失败';
                    按钮.style.background = '#dc3545 !important';
                    alert('复制失败！请手动复制链接：\n' + 选择的链接);
                }
                
                setTimeout(() => {
                    更新按钮状态();
                    按钮.disabled = false;
                }, 3000);
                
            } else {
                console.log('手动触发：未找到小游戏链接');
                按钮.textContent = '未找到链接';
                按钮.style.background = '#ffc107 !important';
                setTimeout(() => {
                    更新按钮状态();
                    按钮.disabled = false;
                }, 3000);
            }
        });

        // 确保按钮添加到页面中
        if (document.body) {
            document.body.appendChild(按钮);
            console.log('✅ 复制按钮已添加到页面左下角');
        } else {
            // 如果body还没准备好，等待并重试
            setTimeout(() => {
                if (document.body) {
                    document.body.appendChild(按钮);
                    console.log('✅ 复制按钮已延迟添加到页面');
                }
            }, 500);
        }
        
        // 立即更新按钮状态
        更新按钮状态();
    }

    // 页面加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 页面加载完成，开始执行主逻辑...');
            获取iframe链接();
            监听DOM变化();
            创建复制按钮();
        });
    } else {
        console.log('📄 页面已加载完成，立即执行主逻辑...');
        获取iframe链接();
        监听DOM变化();
        创建复制按钮();
    }

    // 延迟检查，确保动态内容加载完成
    setTimeout(() => {
        console.log('⏰ 延迟检查开始...');
        获取iframe链接();
        if (!document.getElementById('小游戏复制按钮')) {
            创建复制按钮();
        }
        更新按钮状态();
    }, 2000);
    
    // 添加键盘快捷键 Ctrl+Shift+C 复制链接
    document.addEventListener('keydown', (事件) => {
        if (事件.ctrlKey && 事件.shiftKey && 事件.key === 'C') {
            事件.preventDefault();
            console.log('⌨️ 键盘快捷键触发复制 (Ctrl+Shift+C)');
            
            if (最新游戏链接) {
                console.log('🎯 通过快捷键复制链接:', 最新游戏链接);
                复制链接到剪贴板(最新游戏链接).then((成功) => {
                    if (成功) {
                        console.log('✅ 快捷键复制成功');
                        // 简单的通知
                        const 通知 = document.createElement('div');
                        通知.textContent = '链接已复制！';
                        通知.style.cssText = `
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            background: #28a745;
                            color: white;
                            padding: 10px 20px;
                            border-radius: 5px;
                            z-index: 2147483647;
                            font-family: Arial, sans-serif;
                        `;
                        document.body.appendChild(通知);
                        setTimeout(() => {
                            if (document.body.contains(通知)) {
                                document.body.removeChild(通知);
                            }
                        }, 2000);
                    } else {
                        alert('复制失败！链接：\n' + 最新游戏链接);
                    }
                });
            } else {
                console.log('🔍 快捷键触发：重新搜索游戏链接...');
                获取iframe链接();
                setTimeout(() => {
                    if (最新游戏链接) {
                        复制链接到剪贴板(最新游戏链接);
                    } else {
                        alert('未找到小游戏链接！请确保页面包含目标iframe元素。');
                    }
                }, 1000);
            }
        }
    });

})();
